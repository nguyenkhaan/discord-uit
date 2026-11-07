export const MAX_CHAT_ATTACHMENTS = 5;
export const MAX_CHAT_ATTACHMENT_SIZE_MB = 5;
const MAX_CHAT_ATTACHMENT_SIZE_BYTES =
    MAX_CHAT_ATTACHMENT_SIZE_MB * 1024 * 1024;

export interface PickedChatAttachments {
    accepted: File[];
    error?: string;
}

/** Lọc file ảnh hợp lệ, giới hạn số lượng và dung lượng */
export function pickChatAttachments(
    files: File[],
    currentCount: number
): PickedChatAttachments {
    const images = files.filter((file) => file.type.startsWith('image/'));
    const withinSize = images.filter(
        (file) => file.size <= MAX_CHAT_ATTACHMENT_SIZE_BYTES
    );
    const slotsLeft = Math.max(0, MAX_CHAT_ATTACHMENTS - currentCount);
    const accepted = withinSize.slice(0, slotsLeft);

    let error: string | undefined;
    if (images.length < files.length) {
        error = 'Chỉ chọn được file ảnh.';
    } else if (withinSize.length < images.length) {
        error = `Mỗi ảnh tối đa ${MAX_CHAT_ATTACHMENT_SIZE_MB}MB.`;
    } else if (accepted.length < withinSize.length) {
        error = `Chỉ đính kèm tối đa ${MAX_CHAT_ATTACHMENTS} ảnh.`;
    }
    return { accepted, error };
}
