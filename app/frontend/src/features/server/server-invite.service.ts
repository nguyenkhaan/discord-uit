import { privateClient } from '@/api/client';
import { SERVERS_ENDPOINT } from '@/features/server/server.service';
import type {
    AcceptInviteResponse,
    CreateDirectInvitePayload,
    CreateDirectInviteRequest,
    CreateInviteLinkPayload,
    CreateInviteLinkRequest,
    CreateInviteLinkResponse,
    DeclineInviteResponse,
    DirectInviteResponse,
    InviteLinkDetailsResponse,
    InviteLinkResponse,
    JoinServerInviteResponse,
    MyDirectInviteResponse,
    RevokeInviteLinkPayload,
    UserLookupResponse,
} from '@/features/server/server.type';

const INVITES_ENDPOINT = '/invites';

/** GET /servers/{serverId}/invites/links — chỉ OWNER */
export async function listInviteLinks(
    serverId: string
): Promise<InviteLinkResponse[]> {
    const response = await privateClient.get<InviteLinkResponse[]>(
        `${SERVERS_ENDPOINT}/${serverId}/invites/links`
    );
    return response.data;
}

/** POST /servers/{serverId}/invites/links — chỉ OWNER, tối đa 2 link còn hiệu lực */
export async function createInviteLink({
    serverId,
    maxUses,
    expiresInHours,
}: CreateInviteLinkPayload): Promise<CreateInviteLinkResponse> {
    const body: CreateInviteLinkRequest = { maxUses, expiresInHours };
    const response = await privateClient.post<CreateInviteLinkResponse>(
        `${SERVERS_ENDPOINT}/${serverId}/invites/links`,
        body
    );
    return response.data;
}

/** DELETE /servers/{serverId}/invites/links/{inviteId} — chỉ OWNER */
export async function revokeInviteLink({
    serverId,
    inviteId,
}: RevokeInviteLinkPayload): Promise<void> {
    await privateClient.delete(
        `${SERVERS_ENDPOINT}/${serverId}/invites/links/${inviteId}`
    );
}

/** GET /invites/{token} — xem thông tin server trước khi tham gia */
export async function getInviteLinkDetails(
    token: string
): Promise<InviteLinkDetailsResponse> {
    const response = await privateClient.get<InviteLinkDetailsResponse>(
        `${INVITES_ENDPOINT}/${encodeURIComponent(token)}`
    );
    return response.data;
}

/** POST /invites/{token}/join */
export async function joinServerByInviteLink(
    token: string
): Promise<JoinServerInviteResponse> {
    const response = await privateClient.post<JoinServerInviteResponse>(
        `${INVITES_ENDPOINT}/${encodeURIComponent(token)}/join`
    );
    return response.data;
}

/** GET /users/lookup?email= — tìm đúng một tài khoản đang hoạt động theo email */
export async function lookupUserByEmail(
    email: string
): Promise<UserLookupResponse> {
    const response = await privateClient.get<UserLookupResponse>(
        '/users/lookup',
        { params: { email } }
    );
    return response.data;
}

/** POST /servers/{serverId}/invites — chỉ OWNER */
export async function createDirectInvite({
    serverId,
    recipientId,
}: CreateDirectInvitePayload): Promise<DirectInviteResponse> {
    const body: CreateDirectInviteRequest = { recipientId };
    const response = await privateClient.post<DirectInviteResponse>(
        `${SERVERS_ENDPOINT}/${serverId}/invites`,
        body
    );
    return response.data;
}

/** GET /users/me/invites — chỉ trả về lời mời trực tiếp còn PENDING */
export async function listMyDirectInvites(): Promise<MyDirectInviteResponse[]> {
    const response =
        await privateClient.get<MyDirectInviteResponse[]>('/users/me/invites');
    return response.data;
}

/** POST /invites/{inviteId}/accept */
export async function acceptDirectInvite(
    inviteId: string
): Promise<AcceptInviteResponse> {
    const response = await privateClient.post<AcceptInviteResponse>(
        `${INVITES_ENDPOINT}/${inviteId}/accept`
    );
    return response.data;
}

/** POST /invites/{inviteId}/decline */
export async function declineDirectInvite(
    inviteId: string
): Promise<DeclineInviteResponse> {
    const response = await privateClient.post<DeclineInviteResponse>(
        `${INVITES_ENDPOINT}/${inviteId}/decline`
    );
    return response.data;
}
