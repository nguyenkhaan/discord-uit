import { z } from "zod";

// Chỉ kiểm tra định dạng 8-4-4-4-12, chấp nhận cả id seed dạng 00000000-…
const UuidSchema = z.guid();
const IsoTimestampSchema = z.iso.datetime({ offset: true });

export const ServerJoinCommandSchema = z
    .object({
        serverId: UuidSchema,
    })
    .strict();

export const ServerLeaveCommandSchema = ServerJoinCommandSchema;

// Số ảnh tối đa trong 1 tin, khớp với Spring
export const MAX_CHAT_ATTACHMENTS = 5;

export const ChatSendCommandSchema = z
    .object({
        serverId: UuidSchema,
        clientRequestId: UuidSchema,
        contentText: z.string().trim().max(2000),
        // Id tin được trả lời, bỏ trống khi không reply
        replyToMessageId: UuidSchema.optional(),
        // Id ảnh đã upload qua API, bỏ trống khi không có ảnh
        attachmentMediaIds: z
            .array(UuidSchema)
            .max(MAX_CHAT_ATTACHMENTS)
            .optional(),
    })
    .strict()
    // Phải có chữ hoặc ít nhất 1 ảnh
    .refine(
        (command) =>
            command.contentText.length > 0 ||
            (command.attachmentMediaIds?.length ?? 0) > 0,
        { message: "Message must have text or images", path: ["contentText"] },
    );

// Trích dẫn tin được trả lời; contentText là null khi tin gốc đã thu hồi
export const ChatReplyPreviewSchema = z
    .object({
        messageId: UuidSchema,
        senderUserId: UuidSchema,
        contentText: z.string().max(2000).nullable(),
        deleted: z.boolean(),
    })
    .strict();

// Ảnh đính kèm; url là link tạm, null khi Spring không tạo được link
export const ChatAttachmentSchema = z
    .object({
        mediaId: UuidSchema,
        url: z.string().min(1).nullable(),
        fileName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().int().nonnegative(),
    })
    .strict();

export const ChatMessageDtoSchema = z
    .object({
        messageId: UuidSchema,
        serverId: UuidSchema,
        senderUserId: UuidSchema,
        clientRequestId: UuidSchema,
        // Rỗng khi tin chỉ có ảnh
        contentText: z.string().max(2000),
        createdAt: IsoTimestampSchema,
        replyTo: ChatReplyPreviewSchema.nullable().optional(),
        attachments: z
            .array(ChatAttachmentSchema)
            .max(MAX_CHAT_ATTACHMENTS)
            .optional(),
    })
    .strict();

export type ServerJoinCommand = z.infer<typeof ServerJoinCommandSchema>;
export type ServerLeaveCommand = z.infer<typeof ServerLeaveCommandSchema>;
export type ChatSendCommand = z.infer<typeof ChatSendCommandSchema>;
export type ChatMessageDto = z.infer<typeof ChatMessageDtoSchema>;
export type ChatAttachment = z.infer<typeof ChatAttachmentSchema>;

export type SocketError = {
    code: string;
    message: string;
    retryable: boolean;
};
//Duoc dung de kiem tra xem co nhan duoc message hay chua. Neu nhu ok: true -> tra ve KDL la T, nguoc lai false thi an 1 cai SocketError
export type SocketAck<T> =
    | {
          ok: true;
          data: T;
      }
    | {
          ok: false;
          error: SocketError;
      };
