import type { JSONContent } from '@tiptap/react';

/** Khớp ForumTopicNormalizer và ForumContent ở BE */
export const MAX_FORUM_TOPICS = 5;
export const MAX_FORUM_TOPIC_LENGTH = 30;
export const MAX_FORUM_TITLE_LENGTH = 200;
export const MAX_FORUM_TEXT_LENGTH = 20_000;

const TOPIC_PATTERN = /^[\p{L}\p{N} ._+#-]+$/u;

/** Chuẩn hoá chủ đề; null khi không hợp lệ */
export function normalizeForumTopic(value: string): string | null {
    const topic = value.trim().replace(/\s+/g, ' ').toLowerCase();
    if (
        !topic ||
        topic.length > MAX_FORUM_TOPIC_LENGTH ||
        !TOPIC_PATTERN.test(topic)
    ) {
        return null;
    }
    return topic;
}

export const EMPTY_FORUM_DOC: JSONContent = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
};

/** Đọc nội dung bài; dữ liệu cũ dạng {"text": "..."} đổi thành 1 đoạn văn */
export function parseForumContent(json: string | undefined): JSONContent {
    if (!json) return EMPTY_FORUM_DOC;
    try {
        const value: unknown = JSON.parse(json);
        if (typeof value !== 'object' || value === null) return EMPTY_FORUM_DOC;
        if ('type' in value && value.type === 'doc')
            return value as JSONContent;
        if ('text' in value && typeof value.text === 'string') {
            return {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: value.text
                            ? [{ type: 'text', text: value.text }]
                            : [],
                    },
                ],
            };
        }
    } catch {
        // JSON hỏng thì hiển thị bài trống
    }
    return EMPTY_FORUM_DOC;
}

const relativeFormatter = new Intl.RelativeTimeFormat('vi-VN', {
    numeric: 'auto',
});
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['minute', 60],
    ['hour', 60 * 60],
    ['day', 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
];

/** "5 phút trước", "2 ngày trước"; quá 4 tuần thì hiện ngày */
export function formatForumTime(
    value: string | undefined,
    now: Date = new Date()
): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return 'Vừa xong';
    if (absSeconds >= 4 * 7 * 24 * 60 * 60) return dateFormatter.format(date);

    let unit: Intl.RelativeTimeFormatUnit = 'minute';
    let size = 60;
    for (const [candidate, candidateSize] of RELATIVE_UNITS) {
        if (absSeconds >= candidateSize) {
            unit = candidate;
            size = candidateSize;
        }
    }
    return relativeFormatter.format(Math.round(seconds / size), unit);
}

/** Kiểu chữ cho nội dung bài, dùng chung cho trình soạn và trang đọc */
export const FORUM_PROSE_CLASS =
    'break-words text-body text-foreground [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-foreground-secondary [&_code]:rounded [&_code]:bg-surface-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-heading [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-heading [&_hr]:my-4 [&_hr]:border-line [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-heading [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-on-brand [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-6';
