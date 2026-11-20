import { LoaderCircle, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import LogoImage from '@/assets/images/Logo.webp';
import type { ActiveCallResponse } from '@/features/call/call.type';

interface CallLobbyProps {
    serverName: string;
    userName: string;
    activeCall: ActiveCallResponse | null | undefined;
    isLoadingActiveCall: boolean;
    microphone: boolean;
    camera: boolean;
    onMicrophoneChange: (enabled: boolean) => void;
    onCameraChange: (enabled: boolean) => void;
    onJoin: () => void;
}

const MAX_AVATARS = 4;

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Keeps a local media stream alive while `enabled` is true and stops it
 * when disabled or unmounted, so LiveKit can take the device on join.
 */
function usePreviewStream(kind: 'audio' | 'video', enabled: boolean) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // When disabled, the stale stream is hidden by the return value below.
        if (!enabled) return;

        let cancelled = false;
        let acquired: MediaStream | null = null;

        navigator.mediaDevices
            ?.getUserMedia(
                kind === 'video'
                    ? { video: { width: 1280, height: 720 } }
                    : { audio: true }
            )
            .then((mediaStream) => {
                if (cancelled) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }
                acquired = mediaStream;
                setStream(mediaStream);
                setError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setError(
                    kind === 'video'
                        ? 'Không truy cập được camera. Hãy cấp quyền cho trình duyệt.'
                        : 'Không truy cập được microphone. Hãy cấp quyền cho trình duyệt.'
                );
            });

        return () => {
            cancelled = true;
            acquired?.getTracks().forEach((track) => track.stop());
        };
    }, [kind, enabled]);

    return { stream: enabled ? stream : null, error: enabled ? error : null };
}

export function CallLobby({
    serverName,
    userName,
    activeCall,
    isLoadingActiveCall,
    microphone,
    camera,
    onMicrophoneChange,
    onCameraChange,
    onJoin,
}: CallLobbyProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const video = usePreviewStream('video', camera);
    const audio = usePreviewStream('audio', microphone);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = video.stream;
        }
    }, [video.stream]);

    const participants = activeCall?.participants ?? [];
    const participantCount = activeCall?.participantCount ?? 0;
    const maxParticipants = activeCall?.maxParticipants ?? 30;
    const isFull = participantCount >= maxParticipants;
    const hiddenCount = Math.max(0, participants.length - MAX_AVATARS);
    const deviceError = video.error || audio.error;

    let subtitle = 'Chưa có ai trong cuộc gọi. Bạn sẽ là người bắt đầu.';
    if (isLoadingActiveCall) subtitle = 'Đang kiểm tra cuộc gọi...';
    else if (participantCount > 0)
        subtitle = `${participantCount} người đang tham gia`;

    return (
        <main className="flex min-h-svh flex-col bg-[#101827] text-white">
            <header className="flex items-center gap-3 px-6 py-5">
                <img
                    alt="UIT Connect"
                    className="h-10 w-auto object-contain"
                    src={LogoImage}
                />
                <span className="text-lg font-semibold">UIT Connect</span>
            </header>

            <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10">
                <div className="flex flex-col items-center gap-3 text-center">
                    <h1 className="text-2xl font-bold sm:text-3xl">
                        {serverName}
                    </h1>
                    <p className="flex items-center gap-2 text-sm text-slate-300">
                        {isLoadingActiveCall && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}
                        {subtitle}
                    </p>

                    {participants.length > 0 && (
                        <div className="flex items-center -space-x-2">
                            {participants
                                .slice(0, MAX_AVATARS)
                                .map((participant) => {
                                    const name =
                                        participant.fullName || 'Thành viên';
                                    return (
                                        <div
                                            className="grid size-10 place-items-center rounded-full bg-indigo-500 text-sm font-semibold ring-2 ring-[#101827]"
                                            key={participant.userId}
                                            title={name}
                                        >
                                            {getInitials(name)}
                                        </div>
                                    );
                                })}
                            {hiddenCount > 0 && (
                                <div className="grid size-10 place-items-center rounded-full bg-slate-700 text-sm font-semibold ring-2 ring-[#101827]">
                                    +{hiddenCount}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                    {video.stream ? (
                        <video
                            autoPlay
                            className="size-full scale-x-[-1] object-cover"
                            muted
                            playsInline
                            ref={videoRef}
                        />
                    ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-3">
                            <div className="grid size-24 place-items-center rounded-full bg-indigo-500/25 text-3xl font-bold text-indigo-100 ring-1 ring-white/10">
                                {getInitials(userName)}
                            </div>
                            <span className="text-sm text-slate-400">
                                {camera
                                    ? 'Đang mở camera...'
                                    : 'Camera đang tắt'}
                            </span>
                        </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-lg bg-black/50 px-2.5 py-1 text-sm font-medium">
                        {userName}
                    </div>

                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
                        <button
                            aria-label={
                                microphone ? 'Tắt microphone' : 'Bật microphone'
                            }
                            className={`grid size-12 place-items-center rounded-full transition ${microphone ? 'bg-black/50 hover:bg-black/70' : 'bg-rose-500 hover:bg-rose-600'}`}
                            onClick={() => onMicrophoneChange(!microphone)}
                            title={
                                microphone ? 'Tắt microphone' : 'Bật microphone'
                            }
                            type="button"
                        >
                            {microphone ? (
                                <Mic className="size-5" />
                            ) : (
                                <MicOff className="size-5" />
                            )}
                        </button>
                        <button
                            aria-label={camera ? 'Tắt camera' : 'Bật camera'}
                            className={`grid size-12 place-items-center rounded-full transition ${camera ? 'bg-black/50 hover:bg-black/70' : 'bg-rose-500 hover:bg-rose-600'}`}
                            onClick={() => onCameraChange(!camera)}
                            title={camera ? 'Tắt camera' : 'Bật camera'}
                            type="button"
                        >
                            {camera ? (
                                <Video className="size-5" />
                            ) : (
                                <VideoOff className="size-5" />
                            )}
                        </button>
                    </div>
                </div>

                {deviceError && (
                    <p className="max-w-2xl text-center text-sm text-amber-300">
                        {deviceError}
                    </p>
                )}

                <button
                    className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isFull}
                    onClick={onJoin}
                    type="button"
                >
                    <Video className="size-5" />
                    {participantCount > 0
                        ? 'Tham gia cuộc gọi'
                        : 'Bắt đầu cuộc gọi'}
                </button>
                {isFull && (
                    <p className="text-sm text-rose-300">
                        Cuộc gọi đã đủ {maxParticipants} người.
                    </p>
                )}
            </section>
        </main>
    );
}
