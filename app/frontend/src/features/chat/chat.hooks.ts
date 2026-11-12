import { useInfiniteQuery } from '@tanstack/react-query';
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';

import { getRealtimeSocket } from '@/api/socket';
import { getApiErrorStatus } from '@/lib/api-error';
import { pickChatAttachments } from '@/features/chat/chat.attachments';
import { chatKeys } from '@/features/chat/chat.keys';
import {
    getChatHistory,
    uploadChatAttachment,
} from '@/features/chat/chat.service';
import {
    CHAT_EVENTS,
    joinServerRoom,
    leaveServerRoom,
    sendChatMessage,
} from '@/features/chat/chat.socket';
import type {
    ChatAttachmentDraft,
    ChatConnectionStatus,
    ChatMessageDto,
    ChatMessageView,
    ChatReplyView,
} from '@/features/chat/chat.type';
import {
    chatReducer,
    getChatErrorMessage,
    getChatUploadErrorMessage,
    MAX_CHAT_MESSAGE_LENGTH,
    mergeChatMessages,
} from '@/features/chat/chat.utils';

/** Mã lỗi khi gateway từ chối xác thực */
const UNAUTHENTICATED_ERROR = 'UNAUTHENTICATED';

/** Tải lịch sử chat theo trang */
export function useChatHistory(serverId: string) {
    return useInfiniteQuery({
        enabled: serverId !== '',
        queryKey: chatKeys.history(serverId),
        queryFn: ({ pageParam }) => getChatHistory(serverId, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
        // Không tự tải lại, tin mới đã đến qua socket
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
}

export interface ServerChat {
    messages: ChatMessageView[];
    history: {
        isLoading: boolean;
        isError: boolean;
        hasOlder: boolean;
        isLoadingOlder: boolean;
        loadOlder: () => void;
        retry: () => void;
    };
    connectionStatus: ChatConnectionStatus;
    /** Đã vào room, có thể gửi tin */
    isReady: boolean;
    sendMessage: (
        content: string,
        replyTo?: ChatReplyView,
        attachments?: ChatAttachmentDraft[]
    ) => void;
    retryMessage: (clientRequestId: string) => void;
    reconnect: () => void;
}

/** Ảnh của tin đang gửi; mediaId có rồi thì gửi lại không upload lại */
interface PendingUpload {
    draft: ChatAttachmentDraft;
    mediaId?: string;
}

/** Giải phóng ảnh xem trước trên máy */
function revokePreviews(uploads: PendingUpload[] | undefined) {
    uploads?.forEach((upload) => URL.revokeObjectURL(upload.draft.previewUrl));
}

/** Quản lý chat của một server: kết nối, nhận tin, gửi tin, lịch sử */
export function useServerChat(
    serverId: string,
    currentUserId: string | undefined
): ServerChat {
    const [liveMessages, dispatch] = useReducer(chatReducer, []);
    const historyQuery = useChatHistory(serverId);
    const { refetch: refetchHistory } = historyQuery;
    const hasConnectedRef = useRef(false);
    const messages = useMemo(
        () =>
            mergeChatMessages(
                historyQuery.data?.pages.map((page) => page.messages ?? []) ??
                    [],
                liveMessages
            ),
        [historyQuery.data, liveMessages]
    );
    const [connectionStatus, setConnectionStatus] =
        useState<ChatConnectionStatus>('connecting');
    const [activeServerId, setActiveServerId] = useState(serverId);

    // Đổi server: xóa tin của server cũ
    if (activeServerId !== serverId) {
        setActiveServerId(serverId);
        dispatch({ type: 'reset' });
        setConnectionStatus('connecting');
    }
    const liveMessagesRef = useRef(liveMessages);
    // Ảnh của các tin chưa gửi xong, theo clientRequestId
    const pendingUploadsRef = useRef(new Map<string, PendingUpload[]>());

    // Rời trang: giải phóng ảnh xem trước còn lại
    useEffect(() => {
        const pendingUploads = pendingUploadsRef.current;
        return () => {
            pendingUploads.forEach(revokePreviews);
            pendingUploads.clear();
        };
    }, []);

    useEffect(() => {
        liveMessagesRef.current = liveMessages;
    }, [liveMessages]);

    useEffect(() => {
        if (!serverId) return;

        const socket = getRealtimeSocket();
        let isActive = true;
        hasConnectedRef.current = false;

        async function joinRoom() {
            const result = await joinServerRoom(socket, { serverId });
            if (!isActive) return;
            if (result.ok) {
                setConnectionStatus('joined');
            } else {
                setConnectionStatus(
                    result.error.code === 'NOT_A_MEMBER'
                        ? 'not-member'
                        : 'error'
                );
            }
        }

        function handleConnect() {
            // Vào lại room mỗi lần kết nối
            setConnectionStatus('connecting');
            void joinRoom();
            // Kết nối lại: tải lại lịch sử để lấy tin bị lỡ
            if (hasConnectedRef.current) void refetchHistory();
            hasConnectedRef.current = true;
        }

        function handleDisconnect(reason: string) {
            if (reason !== 'io client disconnect') {
                setConnectionStatus('reconnecting');
            }
        }

        function handleConnectError(error: Error) {
            setConnectionStatus(
                error.message === UNAUTHENTICATED_ERROR
                    ? 'unauthenticated'
                    : 'reconnecting'
            );
        }

        function handleChatCreated(message: ChatMessageDto) {
            if (message.serverId === serverId) {
                dispatch({ type: 'confirmed', message });
            }
        }

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on(CHAT_EVENTS.chatCreated, handleChatCreated);

        if (socket.connected) {
            hasConnectedRef.current = true;
            void joinRoom();
        } else {
            socket.connect();
        }

        return () => {
            isActive = false;
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off(CHAT_EVENTS.chatCreated, handleChatCreated);
            if (socket.connected) {
                void leaveServerRoom(socket, { serverId });
            }
            // Đóng kết nối khi rời trang
            socket.disconnect();
        };
    }, [serverId, refetchHistory]);

    const deliver = useCallback(
        async (
            clientRequestId: string,
            contentText: string,
            replyToMessageId?: string
        ) => {
            const socket = getRealtimeSocket();
            if (!socket.connected) {
                dispatch({
                    type: 'failed',
                    clientRequestId,
                    errorMessage: getChatErrorMessage('DISCONNECTED'),
                });
                return;
            }

            // Upload ảnh trước, chỉ những ảnh chưa upload
            const uploads =
                pendingUploadsRef.current.get(clientRequestId) ?? [];
            try {
                await Promise.all(
                    uploads.map(async (upload) => {
                        if (upload.mediaId) return;
                        const uploaded = await uploadChatAttachment(
                            serverId,
                            upload.draft.file
                        );
                        upload.mediaId = uploaded.mediaId;
                    })
                );
            } catch (error) {
                dispatch({
                    type: 'failed',
                    clientRequestId,
                    errorMessage: getChatUploadErrorMessage(
                        getApiErrorStatus(error)
                    ),
                });
                return;
            }
            const attachmentMediaIds = uploads.flatMap((upload) =>
                upload.mediaId ? [upload.mediaId] : []
            );

            const result = await sendChatMessage(socket, {
                serverId,
                clientRequestId,
                contentText,
                ...(replyToMessageId ? { replyToMessageId } : {}),
                ...(attachmentMediaIds.length > 0
                    ? { attachmentMediaIds }
                    : {}),
            });
            if (result.ok) {
                dispatch({ type: 'confirmed', message: result.data });
                // Đã có ảnh từ server, bỏ ảnh xem trước
                revokePreviews(pendingUploadsRef.current.get(clientRequestId));
                pendingUploadsRef.current.delete(clientRequestId);
                return;
            }
            if (result.error.code === 'NOT_A_MEMBER') {
                setConnectionStatus('not-member');
            }
            dispatch({
                type: 'failed',
                clientRequestId,
                errorMessage: getChatErrorMessage(result.error.code),
            });
        },
        [serverId]
    );

    const sendMessage = useCallback(
        (
            content: string,
            replyTo?: ChatReplyView,
            attachments: ChatAttachmentDraft[] = []
        ) => {
            const contentText = content.trim();
            // Phải có chữ hoặc ảnh
            if (
                !currentUserId ||
                (!contentText && attachments.length === 0) ||
                contentText.length > MAX_CHAT_MESSAGE_LENGTH
            ) {
                revokePreviews(attachments.map((draft) => ({ draft })));
                return;
            }
            // Mã định danh tin, dùng để chống gửi trùng
            const clientRequestId = crypto.randomUUID();
            pendingUploadsRef.current.set(
                clientRequestId,
                attachments.map((draft) => ({ draft }))
            );
            dispatch({
                type: 'sending',
                message: {
                    key: clientRequestId,
                    clientRequestId,
                    senderUserId: currentUserId,
                    contentText,
                    createdAt: new Date().toISOString(),
                    status: 'sending',
                    isDeleted: false,
                    replyTo,
                    // Hiện ảnh trên máy trong lúc upload
                    attachments: attachments.map((draft) => ({
                        key: draft.id,
                        url: draft.previewUrl,
                        fileName: draft.file.name,
                    })),
                },
            });
            void deliver(clientRequestId, contentText, replyTo?.messageId);
        },
        [currentUserId, deliver]
    );

    const retryMessage = useCallback(
        (clientRequestId: string) => {
            const message = liveMessagesRef.current.find(
                (item) => item.clientRequestId === clientRequestId
            );
            if (!message || message.status !== 'failed') return;
            dispatch({ type: 'retrying', clientRequestId });
            void deliver(
                clientRequestId,
                message.contentText,
                message.replyTo?.messageId
            );
        },
        [deliver]
    );

    const reconnect = useCallback(() => {
        const socket = getRealtimeSocket();
        setConnectionStatus('connecting');
        socket.disconnect().connect();
    }, []);

    const { fetchNextPage, hasNextPage, isFetchingNextPage } = historyQuery;
    const loadOlder = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return {
        messages,
        history: {
            isLoading: historyQuery.isPending,
            isError: historyQuery.isError,
            hasOlder: hasNextPage,
            isLoadingOlder: isFetchingNextPage,
            loadOlder,
            retry: () => void refetchHistory(),
        },
        connectionStatus,
        isReady: connectionStatus === 'joined',
        sendMessage,
        retryMessage,
        reconnect,
    };
}

/** Quản lý ảnh đính kèm đang chọn trong ô nhập */
export function useChatAttachments() {
    const [attachments, setAttachments] = useState<ChatAttachmentDraft[]>([]);
    const [error, setError] = useState<string>();
    const attachmentsRef = useRef(attachments);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    // Giải phóng URL xem trước khi rời trang
    useEffect(
        () => () =>
            attachmentsRef.current.forEach((item) =>
                URL.revokeObjectURL(item.previewUrl)
            ),
        []
    );

    const addFiles = useCallback((files: File[]) => {
        const { accepted, error: pickError } = pickChatAttachments(
            files,
            attachmentsRef.current.length
        );
        setError(pickError);
        if (accepted.length === 0) return;
        setAttachments((current) => [
            ...current,
            ...accepted.map((file) => ({
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
            })),
        ]);
    }, []);

    const removeAttachment = useCallback((id: string) => {
        setError(undefined);
        setAttachments((current) => {
            const removed = current.find((item) => item.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return current.filter((item) => item.id !== id);
        });
    }, []);

    const clearAttachments = useCallback(() => {
        setError(undefined);
        setAttachments((current) => {
            current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return [];
        });
    }, []);

    /** Lấy ảnh để gửi; ảnh xem trước giao cho tin nhắn nên không giải phóng */
    const takeAttachments = useCallback(() => {
        const taken = attachmentsRef.current;
        attachmentsRef.current = [];
        setError(undefined);
        setAttachments([]);
        return taken;
    }, []);

    return {
        attachments,
        error,
        addFiles,
        removeAttachment,
        clearAttachments,
        takeAttachments,
    };
}
