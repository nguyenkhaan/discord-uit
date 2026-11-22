import {
    ArrowLeft,
    Camera,
    CameraOff,
    LoaderCircle,
    LogOut,
    Mic,
    MicOff,
    PhoneOff,
    ScreenShare,
    ScreenShareOff,
    Users,
    Video,
    X,
} from 'lucide-react';
import { Track, type Participant } from 'livekit-client';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/useAuth';
import { CallLobby } from '@/features/call/components/CallLobby';
import { ParticipantControls } from '@/features/call/components/ParticipantControls';
import {
    ParticipantTile,
    type TileVariant,
} from '@/features/call/components/ParticipantTile';
import { ScreenShareTile } from '@/features/call/components/ScreenShareTile';
import { useActiveCall } from '@/features/call/hooks/useActiveCall';
import { useLiveKitCall } from '@/features/call/hooks/useLiveKitCall';
import { useServer } from '@/features/server/server.hooks';
import { useServerMembers } from '@/features/server/server-member.hooks';

interface StageItem {
    key: string;
    kind: 'screen' | 'camera';
    participant: Participant;
}

// GetDisplayMedia is missing on most mobile browsers.
const SUPPORTS_SCREEN_SHARE =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getDisplayMedia);

export default function CallRoomPage() {
    const { serverId = '' } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const serverQuery = useServer(serverId);
    const membersQuery = useServerMembers(serverId);
    const { user } = useAuth();
    // Pre-join screen state: nothing connects to LiveKit until "joined".
    const [joined, setJoined] = useState(false);
    const [microphonePref, setMicrophonePref] = useState(true);
    const [cameraPref, setCameraPref] = useState(true);
    const [pinnedKey, setPinnedKey] = useState<string | null>(null);
    const call = useLiveKitCall(serverId, {
        enabled: joined,
        microphone: microphonePref,
        camera: cameraPref,
    });
    const activeCallQuery = useActiveCall(serverId, joined ? 15000 : 5000);

    // Coordinator comes from the server, never from sessionStorage.
    const coordinatorUserId =
        call.coordinatorUserId ??
        activeCallQuery.data?.coordinatorUserId ??
        null;
    const isCoordinator = Boolean(user?.id) && coordinatorUserId === user?.id;
    const localIdentity = call.room?.localParticipant.identity;
    const coordinatorPresent =
        coordinatorUserId !== null &&
        call.participants.some(
            (participant) => participant.identity === coordinatorUserId
        );
    const canControl =
        isCoordinator && coordinatorPresent && call.status === 'connected';

    const leaveCall = call.leave;
    const endCall = call.end;
    const memberNames = useMemo(() => {
        const names = new Map<string, string>();
        membersQuery.data?.forEach((member) => {
            if (member.userId && member.fullName) {
                names.set(member.userId, member.fullName);
            }
        });
        return names;
    }, [membersQuery.data]);
    const [actionError, setActionError] = useState<string | null>(null);

    const getName = useCallback(
        (participant: Participant) =>
            memberNames.get(participant.identity) ||
            participant.name ||
            `Thành viên ${participant.identity.slice(0, 8)}`,
        [memberNames]
    );
    const coordinatorName =
        (coordinatorUserId && memberNames.get(coordinatorUserId)) ||
        activeCallQuery.data?.coordinatorFullName ||
        'Người điều phối';

    // Every screen share and every camera is an item that can be pinned.
    const stageItems = useMemo(() => {
        const items: StageItem[] = [];
        for (const participant of call.participants) {
            if (
                participant.getTrackPublication(Track.Source.ScreenShare)?.track
            ) {
                items.push({
                    key: `screen:${participant.identity}`,
                    kind: 'screen',
                    participant,
                });
            }
        }
        for (const participant of call.participants) {
            items.push({
                key: `camera:${participant.identity}`,
                kind: 'camera',
                participant,
            });
        }
        return items;
    }, [call.participants]);
    const screenItem =
        stageItems.find((item) => item.kind === 'screen') ?? null;
    const stageItem =
        stageItems.find((item) => item.key === pinnedKey) ?? screenItem;
    const stripItems = stageItem
        ? stageItems.filter((item) => item.key !== stageItem.key)
        : [];
    const cameraItems = stageItems.filter((item) => item.kind === 'camera');
    const sharerIdentity = screenItem?.participant.identity ?? null;
    const someoneElseSharing =
        sharerIdentity !== null && sharerIdentity !== localIdentity;

    const togglePin = useCallback((key: string) => {
        setPinnedKey((current) => (current === key ? null : key));
    }, []);

    /**
     * The call lives in its own tab (opened from the server page), so close
     * it when done. Browsers refuse to close tabs the user opened manually,
     * in that case fall back to the server page.
     */
    const closeCallTab = useCallback(() => {
        window.close();
        window.setTimeout(() => {
            navigate(`/servers/${serverId}`, { replace: true });
        }, 300);
    }, [navigate, serverId]);

    const handleLeave = useCallback(async () => {
        setActionError(null);
        try {
            await leaveCall();
            closeCallTab();
        } catch {
            setActionError('Không thể rời cuộc gọi. Vui lòng thử lại.');
        }
    }, [leaveCall, closeCallTab]);

    const handleEnd = useCallback(async () => {
        setActionError(null);
        try {
            await endCall();
            closeCallTab();
        } catch {
            setActionError(
                'Không thể kết thúc cuộc gọi. Có thể bạn không phải người điều phối.'
            );
        }
    }, [endCall, closeCallTab]);

    const renderItem = (item: StageItem, variant: TileVariant) => {
        const { participant } = item;
        const isLocal = participant.identity === localIdentity;
        const showControls = isCoordinator && !isLocal;
        const controlsDisabled = !canControl || call.isControlBusy;
        const isSharing = participant.identity === sharerIdentity;
        const stopShare =
            showControls && isSharing
                ? () => void call.forceStopScreenShare(participant.identity)
                : undefined;

        if (item.kind === 'screen') {
            return (
                <ScreenShareTile
                    actions={
                        stopShare && (
                            <ParticipantControls
                                disabled={controlsDisabled}
                                onForceStopScreenShare={stopShare}
                            />
                        )
                    }
                    displayName={getName(participant)}
                    isLocal={isLocal}
                    isPinned={pinnedKey === item.key}
                    key={item.key}
                    onTogglePin={() => togglePin(item.key)}
                    participant={participant}
                    variant={variant}
                />
            );
        }

        const mute =
            showControls && participant.isMicrophoneEnabled
                ? () => void call.forceMute(participant.identity)
                : undefined;

        return (
            <ParticipantTile
                actions={
                    (mute || stopShare) && (
                        <ParticipantControls
                            disabled={controlsDisabled}
                            onForceMute={mute}
                            onForceStopScreenShare={stopShare}
                        />
                    )
                }
                displayName={getName(participant)}
                isCoordinator={participant.identity === coordinatorUserId}
                isLocal={isLocal}
                isPinned={pinnedKey === item.key}
                isSharingScreen={isSharing}
                key={item.key}
                onTogglePin={() => togglePin(item.key)}
                participant={participant}
                variant={variant}
            />
        );
    };

    const title = serverQuery.data?.name || 'Cuộc gọi trong Server';
    const isConnected =
        call.status === 'connected' || call.status === 'reconnecting';

    if (!joined) {
        return (
            <CallLobby
                activeCall={activeCallQuery.data}
                camera={cameraPref}
                isLoadingActiveCall={activeCallQuery.isLoading}
                microphone={microphonePref}
                onCameraChange={setCameraPref}
                onJoin={() => setJoined(true)}
                onMicrophoneChange={setMicrophonePref}
                serverName={title}
                userName={user?.fullName || 'Bạn'}
            />
        );
    }

    return (
        <main className="flex min-h-svh flex-col bg-[#101827] text-white">
            <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
                <button
                    aria-label="Quay lại Server"
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
                    onClick={() =>
                        void (call.room ? handleLeave() : closeCallTab())
                    }
                    type="button"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-bold sm:text-lg">
                        {title}
                    </h1>
                    <p className="flex items-center gap-2 text-xs text-slate-400">
                        <span
                            className={`size-2 rounded-full ${call.status === 'connected' ? 'bg-emerald-400' : call.status === 'reconnecting' ? 'bg-amber-400' : 'bg-slate-500'}`}
                        />
                        {call.status === 'connecting' &&
                            'Đang kết nối LiveKit...'}
                        {call.status === 'connected' && 'Đang trong cuộc gọi'}
                        {call.status === 'reconnecting' &&
                            'Đang kết nối lại...'}
                        {call.status === 'disconnected' && 'Đã ngắt kết nối'}
                        {call.status === 'error' && 'Không thể kết nối'}
                    </p>
                </div>
                {/* MỚI */}
                {screenItem && (
                    <div className="hidden items-center gap-2 rounded-xl bg-indigo-500/15 px-3 py-2 text-sm text-indigo-200 md:flex">
                        <ScreenShare className="size-4" />
                        {someoneElseSharing
                            ? `${getName(screenItem.participant)} đang chia sẻ màn hình`
                            : 'Bạn đang chia sẻ màn hình'}
                    </div>
                )}
                <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300 sm:flex">
                    <Users className="size-4" />
                    {call.participants.length} / 30
                </div>
            </header>

            <section className="flex flex-1 flex-col items-center justify-center px-3 py-5 sm:px-6">
                {call.status === 'connecting' && (
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                        <LoaderCircle className="size-10 animate-spin text-indigo-400" />
                        <p>Đang kết nối tới phòng gọi...</p>
                    </div>
                )}

                {call.status === 'error' && (
                    <div className="max-w-lg rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-center">
                        <Video className="mx-auto mb-3 size-9 text-rose-300" />
                        <h2 className="text-lg font-bold">
                            Không thể vào cuộc gọi
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-rose-100/90">
                            {call.error || 'Đã xảy ra lỗi khi kết nối.'}
                        </p>
                        <div className="mt-5 flex justify-center gap-3">
                            <Button
                                onClick={() => setJoined(false)}
                                size="compact"
                                variant="secondary"
                            >
                                Thử lại
                            </Button>
                            <Button
                                onClick={closeCallTab}
                                size="compact"
                                variant="secondary"
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                )}

                {call.status === 'disconnected' && (
                    <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                        <PhoneOff className="mx-auto mb-3 size-9 text-slate-300" />
                        <h2 className="text-lg font-bold">
                            Bạn đã rời cuộc gọi
                        </h2>
                        <p className="mt-2 text-sm text-slate-300">
                            {call.notice ||
                                'Cuộc gọi đã kết thúc hoặc kết nối bị ngắt.'}
                        </p>
                        <div className="mt-5 flex justify-center gap-3">
                            <Button
                                onClick={() => setJoined(false)}
                                size="compact"
                                variant="secondary"
                            >
                                Vào lại
                            </Button>
                            <Button
                                onClick={closeCallTab}
                                size="compact"
                                variant="secondary"
                            >
                                Đóng tab
                            </Button>
                        </div>
                    </div>
                )}

                {isConnected && (
                    <div className="w-full max-w-7xl">
                        {call.status === 'reconnecting' && (
                            <div className="mb-4 rounded-xl bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200">
                                Kết nối không ổn định. Đang thử kết nối lại với
                                LiveKit...
                            </div>
                        )}
                        {/* MỚI */}
                        {coordinatorUserId &&
                            !coordinatorPresent &&
                            call.status === 'connected' && (
                                <div className="mb-4 rounded-xl bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200">
                                    Người điều phối đang vắng mặt. Quyền điều
                                    khiển cuộc gọi tạm khoá cho tới khi{' '}
                                    {coordinatorName} quay lại.
                                </div>
                            )}

                        {/* MỚI: stage + strip when something is shared or pinned */}
                        {stageItem ? (
                            <div className="flex flex-col gap-3">
                                <div className="mx-auto flex w-full max-w-6xl justify-center">
                                    {renderItem(stageItem, 'stage')}
                                </div>
                                {stripItems.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {stripItems.map((item) => (
                                            <div
                                                className="w-44 shrink-0 sm:w-56"
                                                key={item.key}
                                            >
                                                {renderItem(item, 'strip')}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={`grid gap-3 ${cameraItems.length <= 1 ? 'mx-auto max-w-4xl grid-cols-1' : cameraItems.length === 2 ? 'mx-auto max-w-5xl grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}
                            >
                                {cameraItems.map((item) =>
                                    renderItem(item, 'grid')
                                )}
                            </div>
                        )}
                        {call.participants.length <= 1 && (
                            <p className="mt-6 text-center text-sm text-slate-400">
                                Bạn đã vào phòng. Đang chờ người khác tham
                                gia...
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* MỚI */}
            {call.notice && call.status !== 'disconnected' && (
                <div className="mx-auto mb-3 flex w-full max-w-2xl items-center gap-3 rounded-xl bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                    <span className="flex-1 text-center">{call.notice}</span>
                    <button
                        aria-label="Đóng thông báo"
                        className="text-sky-200/70 hover:text-sky-100"
                        onClick={call.clearNotice}
                        type="button"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {(call.error || actionError) && call.status !== 'error' && (
                <div className="mx-auto mb-3 max-w-2xl rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200">
                    {actionError || call.error}
                </div>
            )}

            <footer className="flex flex-col items-center gap-3 border-t border-white/10 bg-[#0b1220] px-4 py-5">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <button
                        aria-label={
                            call.isMicrophoneEnabled
                                ? 'Tắt microphone'
                                : 'Bật microphone'
                        }
                        className={`grid size-14 place-items-center rounded-full transition ${call.isMicrophoneEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                        disabled={!isConnected || call.isBusy}
                        onClick={() => void call.toggleMicrophone()}
                        type="button"
                    >
                        {call.isMicrophoneEnabled ? (
                            <Mic className="size-5" />
                        ) : (
                            <MicOff className="size-5" />
                        )}
                    </button>
                    <button
                        aria-label={
                            call.isCameraEnabled ? 'Tắt camera' : 'Bật camera'
                        }
                        className={`grid size-14 place-items-center rounded-full transition ${call.isCameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                        disabled={!isConnected || call.isBusy}
                        onClick={() => void call.toggleCamera()}
                        type="button"
                    >
                        {call.isCameraEnabled ? (
                            <Camera className="size-5" />
                        ) : (
                            <CameraOff className="size-5" />
                        )}
                    </button>
                    {/* MỚI */}
                    {SUPPORTS_SCREEN_SHARE && (
                        <button
                            aria-label={
                                call.isScreenSharing
                                    ? 'Dừng chia sẻ màn hình'
                                    : 'Chia sẻ màn hình'
                            }
                            className={`grid size-14 place-items-center rounded-full transition disabled:opacity-50 ${call.isScreenSharing ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            disabled={
                                !isConnected ||
                                call.isBusy ||
                                call.isScreenShareBusy ||
                                someoneElseSharing
                            }
                            onClick={() => void call.toggleScreenShare()}
                            title={
                                someoneElseSharing && screenItem
                                    ? `${getName(screenItem.participant)} đang chia sẻ màn hình`
                                    : call.isScreenSharing
                                      ? 'Dừng chia sẻ màn hình'
                                      : 'Chia sẻ màn hình'
                            }
                            type="button"
                        >
                            {call.isScreenShareBusy ? (
                                <LoaderCircle className="size-5 animate-spin" />
                            ) : call.isScreenSharing ? (
                                <ScreenShareOff className="size-5" />
                            ) : (
                                <ScreenShare className="size-5" />
                            )}
                        </button>
                    )}
                    <button
                        aria-label="Rời cuộc gọi"
                        className="grid size-14 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                        disabled={!call.room || call.isBusy}
                        onClick={() => void handleLeave()}
                        title="Rời cuộc gọi (cuộc gọi vẫn tiếp tục)"
                        type="button"
                    >
                        <LogOut className="size-5" />
                    </button>
                    {isCoordinator && (
                        <button
                            aria-label="Kết thúc cuộc gọi cho mọi người"
                            className="flex h-14 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                            disabled={!isConnected || call.isBusy}
                            onClick={() => void handleEnd()}
                            title="Kết thúc cuộc gọi cho mọi người"
                            type="button"
                        >
                            <PhoneOff className="size-5" />
                            Kết thúc
                        </button>
                    )}
                </div>
                <div className="text-xs text-slate-500">
                    {isCoordinator
                        ? 'Bạn là người điều phối cuộc gọi'
                        : coordinatorPresent
                          ? `Người điều phối: ${coordinatorName}`
                          : 'Người điều phối đang vắng mặt'}
                    <span className="mx-2">•</span>
                    {call.participants.length} người tham gia
                </div>
            </footer>
        </main>
    );
}
