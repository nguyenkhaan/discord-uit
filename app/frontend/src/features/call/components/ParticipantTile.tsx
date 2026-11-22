import { Crown, Mic, MicOff, Pin, PinOff, ScreenShare } from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Track, type Participant } from 'livekit-client';

export type TileVariant = 'grid' | 'stage' | 'strip';

const TILE_SIZE_CLASS: Record<TileVariant, string> = {
    grid: 'min-h-56 sm:min-h-72',
    stage: 'max-h-[70svh]',
    strip: '',
};

interface ParticipantTileProps {
    participant: Participant;
    isLocal: boolean;
    displayName?: string;
    variant?: TileVariant;
    isPinned?: boolean;
    onTogglePin?: () => void;
    isCoordinator?: boolean;
    isSharingScreen?: boolean;
    /** Coordinator-only controls rendered in the top-right corner. */
    actions?: ReactNode;
}

function getDisplayName(participant: Participant, isLocal: boolean): string {
    if (isLocal) return 'Bạn';
    return participant.name?.trim() || participant.identity;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function TilePinButton({
    isPinned,
    onClick,
}: {
    isPinned: boolean;
    onClick: () => void;
}) {
    const label = isPinned ? 'Bỏ ghim' : 'Ghim lên màn hình chính';
    return (
        <button
            aria-label={label}
            className="grid size-8 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            onClick={onClick}
            title={label}
            type="button"
        >
            {isPinned ? (
                <PinOff className="size-4" />
            ) : (
                <Pin className="size-4" />
            )}
        </button>
    );
}

export function ParticipantTile({
    participant,
    isLocal,
    displayName,
    variant = 'grid',
    isPinned = false,
    onTogglePin,
    isCoordinator = false,
    isSharingScreen = false,
    actions,
}: ParticipantTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const name = displayName || getDisplayName(participant, isLocal);
    const compact = variant === 'strip';

    const cameraPublication = participant.getTrackPublication(
        Track.Source.Camera
    );
    const videoTrack = cameraPublication?.track;
    // A muted camera stays published, so check isMuted too.
    const hasVideo = Boolean(videoTrack) && !cameraPublication?.isMuted;
    const audioTrack = isLocal
        ? undefined
        : participant.getTrackPublication(Track.Source.Microphone)?.track;
    const micIsEnabled = participant.isMicrophoneEnabled;
    const initials = useMemo(() => getInitials(name), [name]);

    useEffect(() => {
        const element = videoRef.current;
        if (!videoTrack || !hasVideo || !element) return;

        videoTrack.attach(element);
        return () => {
            videoTrack.detach(element);
        };
    }, [videoTrack, hasVideo]);

    useEffect(() => {
        const element = audioRef.current;
        if (!audioTrack || !element) return;

        audioTrack.attach(element);
        return () => {
            audioTrack.detach(element);
        };
    }, [audioTrack]);

    return (
        <article
            className={`relative flex aspect-video w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-900 shadow-lg ${isSharingScreen ? 'border-indigo-400/50' : 'border-white/10'} ${TILE_SIZE_CLASS[variant]}`}
        >
            {hasVideo ? (
                <video
                    autoPlay
                    className={`h-full max-h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
                    muted={isLocal}
                    playsInline
                    ref={videoRef}
                />
            ) : (
                <div className="flex flex-col items-center gap-3 text-white">
                    <div
                        className={`grid place-items-center rounded-full bg-indigo-500/25 font-bold text-indigo-100 ring-1 ring-white/10 ${compact ? 'size-12 text-base' : 'size-20 text-2xl'}`}
                    >
                        {initials}
                    </div>
                    {!compact && (
                        <span className="text-sm text-slate-300">
                            Chưa bật camera
                        </span>
                    )}
                </div>
            )}

            {!isLocal && <audio autoPlay ref={audioRef} />}

            {(onTogglePin || isCoordinator || isSharingScreen) && (
                <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    {onTogglePin && (
                        <TilePinButton
                            isPinned={isPinned}
                            onClick={onTogglePin}
                        />
                    )}
                    {isCoordinator && (
                        <span
                            className="grid size-8 place-items-center rounded-full bg-amber-400/20 text-amber-300"
                            title="Người điều phối"
                        >
                            <Crown className="size-4" />
                        </span>
                    )}
                    {isSharingScreen && (
                        <span
                            className="grid size-8 place-items-center rounded-full bg-indigo-500/30 text-indigo-200"
                            title="Đang chia sẻ màn hình"
                        >
                            <ScreenShare className="size-4" />
                        </span>
                    )}
                </div>
            )}

            {actions && <div className="absolute right-2 top-2">{actions}</div>}

            <div
                className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent text-white ${compact ? 'px-2 pb-2 pt-6' : 'px-4 pb-3 pt-8'}`}
            >
                <div
                    className={`min-w-0 truncate font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
                >
                    {name}
                    {isLocal ? ' (Bạn)' : ''}
                </div>
                <div
                    aria-label={
                        micIsEnabled
                            ? 'Microphone đang bật'
                            : 'Microphone đang tắt'
                    }
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-black/40"
                >
                    {micIsEnabled ? (
                        <Mic className="size-4" />
                    ) : (
                        <MicOff className="size-4 text-rose-300" />
                    )}
                </div>
            </div>
        </article>
    );
}