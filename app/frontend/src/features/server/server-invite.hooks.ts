import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/features/notification/notification.hooks';
import { serverKeys } from '@/features/server/server.keys';
import {
    acceptDirectInvite,
    createDirectInvite,
    createInviteLink,
    declineDirectInvite,
    getInviteLinkDetails,
    joinServerByInviteLink,
    listInviteLinks,
    listMyDirectInvites,
    lookupUserByEmail,
    revokeInviteLink,
} from '@/features/server/server-invite.service';
import type {
    CreateInviteLinkPayload,
    RevokeInviteLinkPayload,
} from '@/features/server/server.type';

export function useInviteLinks(serverId: string, enabled = true) {
    return useQuery({
        enabled: enabled && serverId !== '',
        queryKey: serverKeys.inviteLinks(serverId),
        queryFn: () => listInviteLinks(serverId),
    });
}

export function useCreateInviteLinkMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInviteLink,
        onSettled: (_data, _error, { serverId }: CreateInviteLinkPayload) =>
            queryClient.invalidateQueries({
                queryKey: serverKeys.inviteLinks(serverId),
            }),
    });
}

export function useRevokeInviteLinkMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: revokeInviteLink,
        onSettled: (_data, _error, { serverId }: RevokeInviteLinkPayload) =>
            queryClient.invalidateQueries({
                queryKey: serverKeys.inviteLinks(serverId),
            }),
    });
}

export function useInviteLinkDetails(token: string) {
    return useQuery({
        enabled: token !== '',
        queryKey: serverKeys.inviteLinkDetails(token),
        queryFn: () => getInviteLinkDetails(token),
        // 404/410 là trạng thái cuối của link, thử lại không có ích
        retry: false,
    });
}

/** Sau khi vào server mới, danh sách server và số liệu thống kê đều thay đổi */
function useInvalidateServerLists() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
            queryClient.invalidateQueries({
                queryKey: serverKeys.statusCounts(),
            }),
        ]);
}

export function useJoinServerByInviteMutation() {
    const invalidateServerLists = useInvalidateServerLists();

    return useMutation({
        mutationFn: joinServerByInviteLink,
        onSuccess: invalidateServerLists,
    });
}

export function useLookupUserMutation() {
    return useMutation({ mutationFn: lookupUserByEmail });
}

export function useCreateDirectInviteMutation() {
    return useMutation({ mutationFn: createDirectInvite });
}

export function useMyDirectInvites(enabled = true) {
    return useQuery({
        enabled,
        queryKey: serverKeys.myInvites(),
        queryFn: listMyDirectInvites,
    });
}

function useInvalidateInviteResponse() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: serverKeys.myInvites() }),
            queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        ]);
}

export function useAcceptDirectInviteMutation() {
    const invalidateInviteResponse = useInvalidateInviteResponse();
    const invalidateServerLists = useInvalidateServerLists();

    return useMutation({
        mutationFn: acceptDirectInvite,
        onSettled: () =>
            Promise.all([invalidateInviteResponse(), invalidateServerLists()]),
    });
}

export function useDeclineDirectInviteMutation() {
    const invalidateInviteResponse = useInvalidateInviteResponse();

    return useMutation({
        mutationFn: declineDirectInvite,
        onSettled: invalidateInviteResponse,
    });
}
