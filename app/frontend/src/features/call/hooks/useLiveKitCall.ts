import {
    ConnectionState,
    Room,
    RoomEvent,
    type Participant,
} from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    endCall as endCallRequest,
    getCallErrorMessage,
    joinOrStartCall,
} from '@/features/call/call.service';

type CallStatus =
    | 'idle'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'error';

interface UseLiveKitCallResult {
    room: Room | null;
    participants: Participant[];
    status: CallStatus;
    error: string | null;
    isCoordinator: boolean;
    isMicrophoneEnabled: boolean;
    isCameraEnabled: boolean;
    isBusy: boolean;
    toggleMicrophone: () => Promise<void>;
    toggleCamera: () => Promise<void>;
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
    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<CallStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isCoordinator, setIsCoordinator] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
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
                setIsCoordinator(connection.isCoordinator);

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
                nextRoom.on(RoomEvent.LocalTrackPublished, refreshParticipants);
                nextRoom.on(
                    RoomEvent.LocalTrackUnpublished,
                    refreshParticipants
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
                nextRoom.on(RoomEvent.Disconnected, () => {
                    setStatus('disconnected');
                    setIsMicrophoneEnabled(false);
                    setIsCameraEnabled(false);
                    refreshParticipants();
                });

                await nextRoom.connect(
                    connection.response.serverUrl,
                    connection.response.token
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
                        if (!cancelled) setIsMicrophoneEnabled(true);
                    } catch {
                        deviceErrors.push('microphone');
                    }
                }
                if (devices.camera) {
                    try {
                        await nextRoom.localParticipant.setCameraEnabled(true);
                        if (!cancelled) setIsCameraEnabled(true);
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

    const toggleMicrophone = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom) return;

        const nextEnabled = !isMicrophoneEnabled;
        try {
            await activeRoom.localParticipant.setMicrophoneEnabled(nextEnabled);
            setIsMicrophoneEnabled(nextEnabled);
            setError(null);
            refreshParticipants();
        } catch {
            setError(
                nextEnabled
                    ? 'Không thể bật microphone. Hãy kiểm tra quyền truy cập microphone của trình duyệt.'
                    : 'Không thể tắt microphone.'
            );
        }
    }, [isMicrophoneEnabled, refreshParticipants]);

    const toggleCamera = useCallback(async () => {
        const activeRoom = roomRef.current;
        if (!activeRoom) return;

        const nextEnabled = !isCameraEnabled;
        try {
            await activeRoom.localParticipant.setCameraEnabled(nextEnabled);
            setIsCameraEnabled(nextEnabled);
            setError(null);
            refreshParticipants();
        } catch {
            setError(
                nextEnabled
                    ? 'Không thể bật camera. Hãy kiểm tra quyền truy cập camera của trình duyệt.'
                    : 'Không thể tắt camera.'
            );
        }
    }, [isCameraEnabled, refreshParticipants]);

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
        isCoordinator,
        isMicrophoneEnabled,
        isCameraEnabled,
        isBusy,
        toggleMicrophone,
        toggleCamera,
        leave,
        end,
    };
}
