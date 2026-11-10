import type { components, operations } from '@/contract/api-contract';

type Schemas = components['schemas'];

export type ServerResponse = Schemas['ServerResponse'];
export type ServerMemberResponse = Schemas['ServerMemberResponse'];
export type ServerStatusCountResponse = Schemas['ServerStatusCountResponse'];
export type UpdateServerStatusRequest = Schemas['UpdateServerStatusRequest'];
export type DeleteServerRequest = Schemas['DeleteServerRequest'];

export type InviteLinkResponse = Schemas['InviteLinkResponse'];
export type CreateInviteLinkRequest = Schemas['CreateInviteLinkRequest'];
export type CreateInviteLinkResponse = Schemas['CreateInviteLinkResponse'];
export type InviteLinkDetailsResponse = Schemas['InviteLinkDetailsResponse'];
export type JoinServerInviteResponse = Schemas['JoinServerInviteResponse'];
export type CreateDirectInviteRequest = Schemas['CreateDirectInviteRequest'];
export type DirectInviteResponse = Schemas['DirectInviteResponse'];
export type MyDirectInviteResponse = Schemas['MyDirectInviteResponse'];
export type AcceptInviteResponse = Schemas['AcceptInviteResponse'];
export type DeclineInviteResponse = Schemas['DeclineInviteResponse'];
export type UserLookupResponse = Schemas['UserLookupResponse'];

/** PENDING | ACCEPTED | DECLINED | REVOKED | EXPIRED */
export type ServerInviteStatus = NonNullable<InviteLinkResponse['status']>;

/** ACTIVE | LOCKED | CLOSED — lấy trực tiếp từ contract để luôn khớp backend */
export type ServerStatus = UpdateServerStatusRequest['status'];

export type ServerMemberRole = NonNullable<ServerResponse['myRole']>;

/** Query `?status=` dùng chung cho GET /servers và GET /servers/status-counts */
type ListMineQuery = NonNullable<operations['listMine']['parameters']['query']>;

export interface ServerStatusFilter {
    statuses?: NonNullable<ListMineQuery['status']>;
}

/** Số lượng server theo từng trạng thái (đã chuẩn hóa từ ServerStatusCountResponse[]) */
export type ServerStatusCounts = Record<ServerStatus, number>;

export interface CreateServerPayload {
    name: string;
    description?: string;
    image?: File | null;
}

export interface UpdateServerStatusPayload {
    serverId: string;
    status: ServerStatus;
}

export interface CreateInviteLinkPayload extends CreateInviteLinkRequest {
    serverId: string;
}

export interface RevokeInviteLinkPayload {
    serverId: string;
    inviteId: string;
}

export interface CreateDirectInvitePayload extends CreateDirectInviteRequest {
    serverId: string;
}

export interface ServerMemberTarget {
    serverId: string;
    userId: string;
}

export interface AdminDeleteServerPayload {
    serverId: string;
    reason: DeleteServerRequest['reason'];
}
