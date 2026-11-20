import {
    ArrowLeft,
    Camera,
    CameraOff,
    LoaderCircle,
    LogOut,
    Mic,
    MicOff,
    PhoneOff,
    Users,
    Video,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/useAuth';
import { CallLobby } from '@/features/call/components/CallLobby';
import { useActiveCall } from '@/features/call/hooks/useActiveCall';
import { useServer } from '@/features/server/server.hooks';
import { useServerMembers } from '@/features/server/server-member.hooks';
import { ParticipantTile } from '@/features/call/components/ParticipantTile';
import { useLiveKitCall } from '@/features/call/hooks/useLiveKitCall';

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
    const call = useLiveKitCall(serverId, {
        enabled: joined,
        microphone: microphonePref,
        camera: cameraPref,
    });
    const activeCallQuery = useActiveCall(serverId, joined ? 15000 : 5000);
    const isCoordinator =
        call.isCoordinator ||
        (Boolean(user?.id) &&
            activeCallQuery.data?.coordinatorUserId === user?.id);
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
                'Không thể kết thúc cuộc gọi. Có thể bạn không phải người tạo cuộc gọi.'
            );
        }
    }, [endCall, closeCallTab]);

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
                            Cuộc gọi đã kết thúc hoặc kết nối bị ngắt.
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
                        <div
                            className={`grid gap-3 ${call.participants.length <= 1 ? 'mx-auto max-w-4xl grid-cols-1' : call.participants.length === 2 ? 'mx-auto max-w-5xl grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}
                        >
                            {call.participants.map((participant) => (
                                <ParticipantTile
                                    isLocal={
                                        participant.identity ===
                                        call.room?.localParticipant.identity
                                    }
                                    key={participant.identity}
                                    displayName={
                                        memberNames.get(participant.identity) ||
                                        participant.name ||
                                        `Thành viên ${participant.identity.slice(0, 8)}`
                                    }
                                    microphoneEnabled={call.isMicrophoneEnabled}
                                    participant={participant}
                                />
                            ))}
                        </div>
                        {call.participants.length <= 1 && (
                            <p className="mt-6 text-center text-sm text-slate-400">
                                Bạn đã vào phòng. Đang chờ người khác tham
                                gia...
                            </p>
                        )}
                    </div>
                )}
            </section>

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
                        ? 'Bạn là người tạo cuộc gọi'
                        : 'Đang tham gia cuộc gọi'}
                    <span className="mx-2">•</span>
                    {call.participants.length} người tham gia
                </div>
            </footer>
        </main>
    );
}
