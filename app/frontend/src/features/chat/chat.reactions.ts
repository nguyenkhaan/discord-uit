import type {
    ChatReactionView,
    MessageReactionItem,
    MessageReactionUpdatedEvent,
} from '@/features/chat/chat.type';

export interface ChatReactionIcon {
    iconId: string;
    emoji: string;
    /** Động từ cho nhãn truy cập: "3 người đã thả tim" */
    verb: string;
}

/**
 * Icon được phép, khớp bảng react_icon (data.json + V20261114_01).
 * Tạm ghi cứng vì BE chưa có API lấy danh sách icon.
 */
export const CHAT_REACTION_ICONS: ChatReactionIcon[] = [
    {
        iconId: '00000000-0000-0000-0000-000000001201',
        emoji: '👍',
        verb: 'thích',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001202',
        emoji: '❤️',
        verb: 'thả tim',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001204',
        emoji: '😆',
        verb: 'thả haha',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001206',
        emoji: '😮',
        verb: 'thả wow',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001205',
        emoji: '😢',
        verb: 'thả buồn',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001207',
        emoji: '😡',
        verb: 'thả phẫn nộ',
    },
    {
        iconId: '00000000-0000-0000-0000-000000001203',
        emoji: '💡',
        verb: 'thấy hữu ích',
    },
];

const ICON_BY_ID = new Map(
    CHAT_REACTION_ICONS.map((icon) => [icon.iconId, icon])
);

/** Chuyển reaction từ BE sang dạng hiển thị */
export function toReactionViews(
    items: MessageReactionItem[] | null | undefined
): ChatReactionView[] {
    return (items ?? []).flatMap((item) =>
        item.iconId && (item.count ?? 0) > 0
            ? [
                  {
                      iconId: item.iconId,
                      iconImage: item.iconImage ?? '',
                      count: item.count ?? 0,
                      reactedByMe: Boolean(item.reactedByMe),
                  },
              ]
            : []
    );
}

/** Icon mình đang thả, null khi chưa thả */
export function getMyReactionIconId(
    reactions: ChatReactionView[]
): string | null {
    return reactions.find((reaction) => reaction.reactedByMe)?.iconId ?? null;
}

/**
 * Cập nhật tạm (optimistic) khi mình thả, đổi hoặc bỏ reaction.
 * Mỗi người chỉ có 1 reaction; iconId null là bỏ reaction.
 */
export function applyMyReaction(
    reactions: ChatReactionView[],
    iconId: string | null
): ChatReactionView[] {
    // Bỏ reaction cũ của mình
    const withoutMine = reactions
        .map((reaction) =>
            reaction.reactedByMe
                ? { ...reaction, count: reaction.count - 1, reactedByMe: false }
                : reaction
        )
        .filter((reaction) => reaction.count > 0);

    if (!iconId) return withoutMine;

    const existing = withoutMine.find((reaction) => reaction.iconId === iconId);
    if (existing) {
        return withoutMine.map((reaction) =>
            reaction.iconId === iconId
                ? { ...reaction, count: reaction.count + 1, reactedByMe: true }
                : reaction
        );
    }
    return [
        ...withoutMine,
        {
            iconId,
            iconImage: ICON_BY_ID.get(iconId)?.emoji ?? '',
            count: 1,
            reactedByMe: true,
        },
    ];
}

/**
 * Áp event realtime: số đếm lấy từ event, reactedByMe giữ theo dữ liệu hiện có
 * (event gửi chung cho cả room nên không có reactedByMe)
 */
export function mergeReactionEvent(
    current: ChatReactionView[],
    event: MessageReactionUpdatedEvent
): ChatReactionView[] {
    const myIconId = getMyReactionIconId(current);
    return event.reactions
        .filter((reaction) => reaction.count > 0)
        .map((reaction) => ({
            iconId: reaction.iconId,
            iconImage: reaction.iconImage,
            count: reaction.count,
            reactedByMe: reaction.iconId === myIconId,
        }));
}

/** Nhãn truy cập, ví dụ "3 người đã thả tim" */
export function getReactionLabel(reaction: ChatReactionView): string {
    const verb =
        ICON_BY_ID.get(reaction.iconId)?.verb ?? `thả ${reaction.iconImage}`;
    return `${reaction.count} người đã ${verb}`;
}
