import type { ChatReactionView } from '@/features/chat/chat.type';
import { getReactionLabel } from '@/features/chat/chat.reactions';
import { cn } from '@/lib/utils';

interface ChatReactionBarProps {
    reactions: ChatReactionView[];
    disabled?: boolean;
    /** iconId null là bỏ reaction */
    onToggle: (iconId: string | null) => void;
}

/** Các chip reaction dưới bong bóng, bấm để thả hoặc bỏ */
export function ChatReactionBar({
    reactions,
    disabled,
    onToggle,
}: ChatReactionBarProps) {
    if (reactions.length === 0) return null;

    return (
        <ul aria-label="Cảm xúc" className="mt-1 flex flex-wrap gap-1">
            {reactions.map((reaction) => (
                <li key={reaction.iconId}>
                    <button
                        aria-label={`${getReactionLabel(reaction)}${
                            reaction.reactedByMe ? ', có bạn. Bấm để bỏ' : ''
                        }`}
                        aria-pressed={reaction.reactedByMe}
                        className={cn(
                            'inline-flex min-h-7 cursor-pointer items-center gap-1 rounded-full border px-2 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed',
                            reaction.reactedByMe
                                ? 'border-brand bg-brand-subtle text-brand'
                                : 'border-line bg-surface text-foreground-secondary hover:bg-surface-subtle'
                        )}
                        disabled={disabled}
                        onClick={() =>
                            onToggle(
                                reaction.reactedByMe ? null : reaction.iconId
                            )
                        }
                        title={getReactionLabel(reaction)}
                        type="button"
                    >
                        <span aria-hidden="true" className="text-sm">
                            {reaction.iconImage}
                        </span>
                        <span aria-hidden="true" className="font-semibold">
                            {reaction.count}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
