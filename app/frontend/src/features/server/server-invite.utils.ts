import type { InviteLinkResponse } from '@/features/server/server.type';

/** Phải khớp với giới hạn MAX_ACTIVE_INVITE_LINKS ở InviteLinkService (backend) */
export const MAX_ACTIVE_INVITE_LINKS = 2;

export const INVITE_LINK_MAX_USES_OPTIONS = [1, 5, 10, 25, 50, 100] as const;
export const DEFAULT_INVITE_LINK_MAX_USES = 10;

export const INVITE_LINK_EXPIRY_OPTIONS = [
    { hours: 1, label: '1 giờ' },
    { hours: 3, label: '3 giờ' },
    { hours: 24, label: '1 ngày' },
    { hours: 168, label: '7 ngày' },
] as const;
export const DEFAULT_INVITE_LINK_EXPIRY_HOURS = 3;

type InviteLinkUsage = Pick<
    InviteLinkResponse,
    'status' | 'expiresAt' | 'maxUses' | 'useCount'
>;

/** Link còn dùng được: PENDING, chưa hết hạn và còn lượt — cùng điều kiện với backend */
export function isInviteLinkRedeemable(
    link: InviteLinkUsage,
    now: number = Date.now()
): boolean {
    if (link.status !== 'PENDING') return false;
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= now) {
        return false;
    }
    return (link.useCount ?? 0) < (link.maxUses ?? 0);
}

export function getRedeemableInviteLinks<TLink extends InviteLinkUsage>(
    links: TLink[],
    now: number = Date.now()
): TLink[] {
    return links.filter((link) => isInviteLinkRedeemable(link, now));
}

const inviteDateFormatter = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
});

export function formatInviteExpiry(expiresAt?: string): string {
    if (!expiresAt) return 'Không hết hạn';
    const date = new Date(expiresAt);
    return Number.isNaN(date.getTime())
        ? 'Không rõ thời hạn'
        : `Hết hạn ${inviteDateFormatter.format(date)}`;
}

/** Lý do link không dùng được nữa, hoặc null nếu link còn hiệu lực */
export function getInviteLinkUnavailableReason(
    link: InviteLinkUsage,
    now: number = Date.now()
): string | null {
    if (isInviteLinkRedeemable(link, now)) return null;
    if (link.status === 'REVOKED')
        return 'Link mời này đã bị chủ server thu hồi.';
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= now) {
        return 'Link mời này đã hết hạn.';
    }
    if ((link.useCount ?? 0) >= (link.maxUses ?? 0)) {
        return 'Link mời này đã hết lượt sử dụng.';
    }
    return 'Link mời này không còn hiệu lực.';
}
