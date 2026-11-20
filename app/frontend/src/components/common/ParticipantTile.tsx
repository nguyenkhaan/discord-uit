import { Mic, MicOff } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Track, type Participant } from 'livekit-client';

interface ParticipantTileProps {
    participant: Participant;
    isLocal: boolean;
    microphoneEnabled?: boolean;
    displayName?: string;
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

export function ParticipantTile({
    participant,
    isLocal,
    microphoneEnabled,
    displayName,
}: ParticipantTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const name = displayName || getDisplayName(participant, isLocal);

    const videoTrack = participant.getTrackPublication(
        Track.Source.Camera
    )?.track;
    const audioTrack = isLocal
        ? undefined
        : participant.getTrackPublication(Track.Source.Microphone)?.track;

    const hasVideo = Boolean(videoTrack);
    const initials = useMemo(() => getInitials(name), [name]);

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

    const remoteMicrophone = participant.getTrackPublication(
        Track.Source.Microphone
    );
    const micIsEnabled = isLocal
        ? Boolean(microphoneEnabled)
        : Boolean(remoteMicrophone && !remoteMicrophone.isMuted);

    return (
        <article className="relative flex aspect-video min-h-56 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg sm:min-h-72">
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
                    <div className="grid size-20 place-items-center rounded-full bg-indigo-500/25 text-2xl font-bold text-indigo-100 ring-1 ring-white/10">
                        {initials}
                    </div>
                    <span className="text-sm text-slate-300">
                        Chưa bật camera
                    </span>
                </div>
            )}

            {!isLocal && <audio autoPlay ref={audioRef} />}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8 text-white">
                <div className="min-w-0 truncate text-sm font-semibold">
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
