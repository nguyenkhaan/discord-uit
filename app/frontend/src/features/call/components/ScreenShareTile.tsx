import { ScreenShare } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Track, type Participant } from 'livekit-client';

import {
    TilePinButton,
    type TileVariant,
} from '@/features/call/components/ParticipantTile';

interface ScreenShareTileProps {
    participant: Participant;
    isLocal: boolean;
    displayName: string;
    variant: TileVariant;
    isPinned?: boolean;
    onTogglePin?: () => void;
    actions?: ReactNode;
}

/** Shows one participant's shared screen (and its audio for remote viewers). */
export function ScreenShareTile({
    participant,
    isLocal,
    displayName,
    variant,
    isPinned = false,
    onTogglePin,
    actions,
}: ScreenShareTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoTrack = participant.getTrackPublication(
        Track.Source.ScreenShare
    )?.track;
    // Never play our own screen audio back to ourselves.
    const audioTrack = isLocal
        ? undefined
        : participant.getTrackPublication(Track.Source.ScreenShareAudio)
              ?.track;

    useEffect(() => {
        const element = videoRef.current;
        if (!videoTrack || !element) return;
        videoTrack.attach(element);
        return () => {
            videoTrack.detach(element);
        };
    }, [videoTrack]);

    useEffect(() => {
        const element = audioRef.current;
        if (!audioTrack || !element) return;
        audioTrack.attach(element);
        return () => {
            audioTrack.detach(element);
        };
    }, [audioTrack]);

    const compact = variant === 'strip';

    return (
        <article
            className={`relative flex aspect-video w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-400/40 bg-black shadow-lg ${variant === 'stage' ? 'max-h-[70svh]' : ''}`}
        >
            <video
                autoPlay
                className="h-full w-full object-contain"
                muted
                playsInline
                ref={videoRef}
            />
            {audioTrack && <audio autoPlay ref={audioRef} />}

            {onTogglePin && (
                <div className="absolute left-2 top-2">
                    <TilePinButton isPinned={isPinned} onClick={onTogglePin} />
                </div>
            )}
            {actions && <div className="absolute right-2 top-2">{actions}</div>}

            <div
                className={`absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent font-semibold text-white ${compact ? 'px-2 pb-2 pt-6 text-xs' : 'px-4 pb-3 pt-8 text-sm'}`}
            >
                <ScreenShare className="size-4 shrink-0 text-indigo-300" />
                <span className="truncate">
                    {isLocal
                        ? 'Bạn đang chia sẻ màn hình'
                        : `Màn hình của ${displayName}`}
                </span>
            </div>
        </article>
    );
}