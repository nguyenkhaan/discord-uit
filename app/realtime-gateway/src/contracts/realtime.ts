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

export const ChatSendCommandSchema = z
    .object({
        serverId: UuidSchema,
        clientRequestId: UuidSchema,
        contentText: z.string().trim().min(1).max(2000),
    })
    .strict();

export const ChatMessageDtoSchema = z
    .object({
        messageId: UuidSchema,
        serverId: UuidSchema,
        senderUserId: UuidSchema,
        clientRequestId: UuidSchema,
        contentText: z.string().min(1).max(2000),
        createdAt: IsoTimestampSchema,
    })
    .strict();

export type ServerJoinCommand = z.infer<typeof ServerJoinCommandSchema>;
export type ServerLeaveCommand = z.infer<typeof ServerLeaveCommandSchema>;
export type ChatSendCommand = z.infer<typeof ChatSendCommandSchema>;
export type ChatMessageDto = z.infer<typeof ChatMessageDtoSchema>;

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
