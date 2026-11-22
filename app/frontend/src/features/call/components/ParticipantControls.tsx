import { MicOff, ScreenShareOff } from 'lucide-react';

interface ParticipantControlsProps {
    disabled: boolean;
    onForceMute?: () => void;
    onForceStopScreenShare?: () => void;
}

/** Coordinator-only actions shown on a remote participant's tile. */
export function ParticipantControls({
    disabled,
    onForceMute,
    onForceStopScreenShare,
}: ParticipantControlsProps) {
    const buttonClass =
        'grid size-8 place-items-center rounded-full bg-black/50 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/50';

    return (
        <div className="flex gap-1.5">
            {onForceMute && (
                <button
                    aria-label="Tắt microphone của người này"
                    className={buttonClass}
                    disabled={disabled}
                    onClick={onForceMute}
                    title="Tắt microphone"
                    type="button"
                >
                    <MicOff className="size-4" />
                </button>
            )}
            {onForceStopScreenShare && (
                <button
                    aria-label="Dừng chia sẻ màn hình của người này"
                    className={buttonClass}
                    disabled={disabled}
                    onClick={onForceStopScreenShare}
                    title="Dừng chia sẻ màn hình"
                    type="button"
                >
                    <ScreenShareOff className="size-4" />
                </button>
            )}
        </div>
    );
}