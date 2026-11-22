import {
    ConnectionState,
    DisconnectReason, 
    Room,
    RoomEvent,
    Track, 
    createLocalScreenTracks, 
    type LocalTrack, 
    type Participant,
} from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    endCall as endCallRequest,
    forceMute as forceMuteRequest, 
    forceStopScreenShare as forceStopScreenShareRequest, 
    getCallErrorMessage,
    getControlErrorMessage, 
    getScreenShareErrorMessage, 
    joinOrStartCall,
    startScreenShare as startScreenShareRequest, 
    stopScreenShare as stopScreenShareRequest, 
} from '@/features/call/call.service';

type CallStatus =
    | 'idle'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'error';

/** How long to wait for LiveKit to deliver the screen_share grant. */
const SCREEN_SHARE_PERMISSION_TIMEOUT_MS = 5000; 

interface UseLiveKitCallResult {
    room: Room | null;
    participants: Participant[];
    status: CallStatus;
    error: string | null;
    notice: string | null; 
    coordinatorUserId: string | null;
    isMicrophoneEnabled: boolean;
    isCameraEnabled: boolean;
    isScreenSharing: boolean;
    isBusy: boolean;
    isScreenShareBusy: boolean;
    isControlBusy: boolean; 
    toggleMicrophone: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleScreenShare: () => Promise<void>; 
    forceMute: (targetUserId: string) => Promise<void>; 
    forceStopScreenShare: (targetUserId: string) => Promise<void>; 
    clearNotice: () => void; 
    leave: () => Promise<void>;
    end: () => Promise<void>;
}

export interface UseLiveKitCallOptions {
    /** Connect only after the user presses "Tham gia cuộc gọi". */
    enabled: boolean;
    /** Device state chosen on the pre-join screen. */
    microphone: boolean;
    camera: boolean;
}

/** True when LiveKit currently lets this participant publish a screen share. */
function canPublishScreenShare(participant: Participant): boolean {
    const permissions = participant.permissions;
    if (!permissions?.canPublish) return false;
    // LiveKit semantics: an empty list means every source is allowed.
    if (permissions.canPublishSources.length === 0) return true;
    return permissions.canPublishSources.some(
        (source) => Track.sourceFromProto(source) === Track.Source.ScreenShare
    );
}

/** Resolves true once the backend's screen_share grant reaches this client. */
function waitForScreenSharePermission(
    room: Room,
    timeoutMs: number
): Promise<boolean> {
    if (canPublishScreenShare(room.localParticipant)) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const handler = (_previous: unknown, participant: Participant) => {
            if (participant.identity !== room.localParticipant.identity) return;
            if (!canPublishScreenShare(participant)) return;
            cleanup();
            resolve(true);
        };
        const cleanup = () => {
            window.clearTimeout(timer);
            room.off(RoomEvent.ParticipantPermissionsChanged, handler);
        };
        const timer = window.setTimeout(() => {
            cleanup();
            resolve(false);
        }, timeoutMs);

        room.on(RoomEvent.ParticipantPermissionsChanged, handler);
    });
}

/** Unpublishes (and stops) the local screen video and screen audio tracks. */
async function unpublishScreenShare(room: Room): Promise<void> {
    const publications = [
        ...room.localParticipant.trackPublications.values(),
    ].filter(
        (publication) =>
            publication.source === Track.Source.ScreenShare ||
            publication.source === Track.Source.ScreenShareAudio
    );
    for (const publication of publications) {
        if (publication.track) {
            await room.localParticipant.unpublishTrack(publication.track);
        }
    }
}

/** The user closed the browser's screen picker without choosing anything. */
function isPickerCancelled(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error.name === 'NotAllowedError' || error.name === 'AbortError')
    );
}

export function useLiveKitCall(
    serverId: string,
    { enabled, microphone, camera }: UseLiveKitCallOptions
): UseLiveKitCallResult {
    const roomRef = useRef<Room | null>(null);
    // Read device choices once at connect time without re-running the effect.
    const initialDevicesRef = useRef({ microphone, camera });
    useEffect(() => {
        initialDevicesRef.current = { microphone, camera };
    }, [microphone, camera]);
    const selfMicChangeRef = useRef(false);
    const screenShareBusyRef = useRef(false); 
    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<CallStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null); 
    const [coordinatorUserId, setCoordinatorUserId] = useState<string | null>(
        null
    );
    const [isBusy, setIsBusy] = useState(false);
    const [isScreenShareBusy, setIsScreenShareBusy] = useState(false); 
    const [isControlBusy, setIsControlBusy] = useState(false); 
    const [participantRevision, setParticipantRevision] = useState(0);

    const refreshParticipants = useCallback(() => {
        setParticipantRevision((revision) => revision + 1);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        let connectingRoom: Room | null = null;

        async function connect() {
            setStatus('connecting');
            setError(null);
            setNotice(null);

            try {
                const connection = await joinOrStartCall(serverId);
                if (cancelled) return;

                const nextRoom = new Room({
                    adaptiveStream: true,
                    dynacast: true,
                });
                connectingRoom = nextRoom;
                roomRef.current = nextRoom;
                setRoom(nextRoom);
                setCoordinatorUserId(connection.coordinatorUserId); 

                const isLocal = (participant: Participant) =>
                    participant.identity === nextRoom.localParticipant.identity;

                nextRoom.on(
                    RoomEvent.ParticipantConnected,
                    refreshParticipants
                );
                nextRoom.on(
                    RoomEvent.ParticipantDisconnected,
                    refreshParticipants
                );
                nextRoom.on(RoomEvent.TrackSubscribed, refreshParticipants);
                nextRoom.on(RoomEvent.TrackUnsubscribed, refreshParticipants);
                nextRoom.on(RoomEvent.TrackPublished, refreshParticipants); 
                nextRoom.on(RoomEvent.TrackUnpublished, refreshParticipants); 
                nextRoom.on(RoomEvent.LocalTrackPublished, refreshParticipants);

                nextRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
                    if (
                        publication.source === Track.Source.ScreenShare &&
                        nextRoom.state === ConnectionState.Connected
                    ) {
                        void stopScreenShareRequest(serverId).catch(
                            () => undefined
                        );
                    }
                    refreshParticipants();
                });

                nextRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
                    if (
                        isLocal(participant) &&
                        publication.source === Track.Source.Microphone &&
                        !selfMicChangeRef.current
                    ) {
                        setNotice('Người điều phối đã tắt microphone của bạn.');
                    }
                    refreshParticipants();
                });
                nextRoom.on(RoomEvent.TrackUnmuted, refreshParticipants);

                nextRoom.on(
                    RoomEvent.ParticipantPermissionsChanged,
                    (_previous, participant) => {
                        if (!isLocal(participant)) return;
                        if (
                            participant.isScreenShareEnabled &&
                            !canPublishScreenShare(participant)
                        ) {
                            setNotice(
                                'Người điều phối đã dừng chia sẻ màn hình của bạn.'
                            );
                            void unpublishScreenShare(nextRoom)
                                .catch(() => undefined)
                                .finally(refreshParticipants);
                        }
                    }
                );

                nextRoom.on(
                    RoomEvent.ConnectionStateChanged,
                    (connectionState) => {
                        if (connectionState === ConnectionState.Reconnecting) {
                            setStatus('reconnecting');
                        } else if (
                            connectionState === ConnectionState.Connected
                        ) {
                            setStatus('connected');
                        } else if (
                            connectionState === ConnectionState.Disconnected
                        ) {
                            setStatus('disconnected');
                        }
                    }
                );
                nextRoom.on(RoomEvent.Disconnected, (reason) => {
                    setStatus('disconnected');
                    if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
                        setNotice(
                            'Bạn đã vào cuộc gọi này ở một tab khác nên tab này bị ngắt kết nối.'
                        );
                    } else if (reason === DisconnectReason.ROOM_DELETED) {
                        setNotice('Cuộc gọi đã kết thúc.');
                    }
                    refreshParticipants();
                });

                await nextRoom.connect(
                    connection.serverUrl, 
                    connection.token 
                );

                if (cancelled) {
                    await nextRoom.disconnect();
                    return;
                }

                setStatus('connected');
                refreshParticipants();

                // Apply the microphone/camera choice from the pre-join screen.
                const devices = initialDevicesRef.current;
                const deviceErrors: string[] = [];
                if (devices.microphone) {
                    try {
                        await nextRoom.localParticipant.setMicrophoneEnabled(
                            true
                        );
                    } catch {
                        deviceErrors.push('microphone');
                    }
                }
                if (devices.camera) {
                    try {
                        await nextRoom.localParticipant.setCameraEnabled(true);
                    } catch {
                        deviceErrors.push('camera');
                    }
                }
                if (cancelled) return;
                if (deviceErrors.length > 0) {
                    setError(
                        `Không thể bật ${deviceErrors.join(' và ')}. Hãy kiểm tra quyền truy cập của trình duyệt.`
                    );
                }
                refreshParticipants();
            } catch (connectionError) {
                if (!cancelled) {
                    setError(getCallErrorMessage(connectionError));
                    setStatus('error');
                }
            }
        }

        void connect();

        return () => {
            cancelled = true;
            if (connectingRoom) {
                void connectingRoom.disconnect();
            }
            roomRef.current = null;
        };
    }, [serverId, enabled, refreshParticipants]);

    const participants = useMemo(() => {
        if (!room) return [];
        // participantRevision intentionally causes a fresh snapshot when Room events fire.
        void participantRevision;
        return [room.localParticipant, ...room.remoteParticipants.values()];
    }, [room, participantRevision]);

    const localMedia = useMemo(() => {
        void participantRevision;
        const local = room?.localParticipant;
        return {
            microphone: local?.isMicrophoneEnabled ?? false,
            camera: local?.isCameraEnabled ?? false,
            screenShare: local?.isScreenShareEnabled ?? false,
        };
    }, [room, participantRevision]);

    const toggleMicrophone = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom) return;

        const nextEnabled = !activeRoom.localParticipant.isMicrophoneEnabled;
        selfMicChangeRef.current = true;
        try {
            await activeRoom.localParticipant.setMicrophoneEnabled(nextEnabled);
            setError(null);
        } catch {
            setError(
                nextEnabled
                    ? 'Không thể bật microphone. Hãy kiểm tra quyền truy cập microphone của trình duyệt.'
                    : 'Không thể tắt microphone.'
            );
        } finally {
            selfMicChangeRef.current = false;
            refreshParticipants();
        }
    }, [refreshParticipants]);

    const toggleCamera = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom) return;

        const nextEnabled = !activeRoom.localParticipant.isCameraEnabled;
        try {
            await activeRoom.localParticipant.setCameraEnabled(nextEnabled);
            setError(null);
        } catch {
            setError(
                nextEnabled
                    ? 'Không thể bật camera. Hãy kiểm tra quyền truy cập camera của trình duyệt.'
                    : 'Không thể tắt camera.'
            );
        } finally {
            refreshParticipants();
        }
    }, [refreshParticipants]);

    const startScreenShare = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom || screenShareBusyRef.current) return;
        screenShareBusyRef.current = true;
        setIsScreenShareBusy(true);
        setError(null);

        let tracks: LocalTrack[] = [];
        let slotReserved = false;
        try {
            // 1. Let the user pick a screen before reserving the slot.
            try {
                tracks = await createLocalScreenTracks({ audio: true });
            } catch (pickerError) {
                if (isPickerCancelled(pickerError)) return;
                throw pickerError;
            }

            // 2. Ask the backend for the single sharer slot (409 when taken).
            await startScreenShareRequest(serverId);
            slotReserved = true;

            // 3. The backend grants screen_share through LiveKit; wait for it.
            const granted = await waitForScreenSharePermission(
                activeRoom,
                SCREEN_SHARE_PERMISSION_TIMEOUT_MS
            );
            if (!granted) {
                throw new Error(
                    'Chưa nhận được quyền chia sẻ màn hình từ máy chủ. Vui lòng thử lại.'
                );
            }

            // 4. Tracks are already tagged ScreenShare / ScreenShareAudio.
            for (const track of tracks) {
                await activeRoom.localParticipant.publishTrack(track);
            }
        } catch (shareError) {
            await unpublishScreenShare(activeRoom).catch(() => undefined);
            tracks.forEach((track) => track.stop());
            if (slotReserved) {
                await stopScreenShareRequest(serverId).catch(() => undefined);
            }
            setError(getScreenShareErrorMessage(shareError));
        } finally {
            screenShareBusyRef.current = false;
            setIsScreenShareBusy(false);
            refreshParticipants();
        }
    }, [serverId, refreshParticipants]);

    const stopScreenShare = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom || screenShareBusyRef.current) return;
        screenShareBusyRef.current = true;
        setIsScreenShareBusy(true);
        try {
            // LocalTrackUnpublished releases the backend slot.
            await unpublishScreenShare(activeRoom);
            setError(null);
        } catch {
            setError('Không thể dừng chia sẻ màn hình.');
        } finally {
            screenShareBusyRef.current = false;
            setIsScreenShareBusy(false);
            refreshParticipants();
        }
    }, [refreshParticipants]);

    const toggleScreenShare = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom) return;
        if (activeRoom.localParticipant.isScreenShareEnabled) {
            await stopScreenShare();
        } else {
            await startScreenShare();
        }
    }, [startScreenShare, stopScreenShare]);

    const forceMute = useCallback(
        async (targetUserId: string) => {
            setIsControlBusy(true);
            setError(null);
            try {
                await forceMuteRequest(serverId, targetUserId);
            } catch (controlError) {
                setError(getControlErrorMessage(controlError, 'mute'));
            } finally {
                setIsControlBusy(false);
                refreshParticipants();
            }
        },
        [serverId, refreshParticipants]
    );

    const forceStopScreenShare = useCallback(
        async (targetUserId: string) => {
            setIsControlBusy(true);
            setError(null);
            try {
                await forceStopScreenShareRequest(serverId, targetUserId);
            } catch (controlError) {
                setError(getControlErrorMessage(controlError, 'stop-share'));
            } finally {
                setIsControlBusy(false);
                refreshParticipants();
            }
        },
        [serverId, refreshParticipants]
    );

    const clearNotice = useCallback(() => setNotice(null), []);
    const leave = useCallback(async () => {
        setIsBusy(true);
        try {
            await roomRef.current?.disconnect();
            setStatus('disconnected');
        } finally {
            setIsBusy(false);
        }
    }, []);

    const end = useCallback(async () => {
        setIsBusy(true);
        try {
            await endCallRequest(serverId);
            await roomRef.current?.disconnect();
            setStatus('disconnected');
        } catch (endError) {
            setError(getCallErrorMessage(endError));
            throw endError;
        } finally {
            setIsBusy(false);
        }
    }, [serverId]);

    return {
        room,
        participants,
        status,
        error,
        notice,
        coordinatorUserId,
        isMicrophoneEnabled: localMedia.microphone,
        isCameraEnabled: localMedia.camera,
        isScreenSharing: localMedia.screenShare,
        isBusy,
        isScreenShareBusy,
        isControlBusy,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        forceMute,
        forceStopScreenShare,
        clearNotice,
        leave,
        end,
    };
}