import { Link2 } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { inputVariants } from '@/components/common/inputVariants';
import { useCreateInviteLinkMutation } from '@/features/server/server-invite.hooks';
import {
    DEFAULT_INVITE_LINK_EXPIRY_HOURS,
    DEFAULT_INVITE_LINK_MAX_USES,
    INVITE_LINK_EXPIRY_OPTIONS,
    INVITE_LINK_MAX_USES_OPTIONS,
    MAX_ACTIVE_INVITE_LINKS,
} from '@/features/server/server-invite.utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

interface InviteLinkCreateFormProps {
    serverId: string;
    activeLinkCount: number;
    onCreated: (inviteUrl: string) => void;
}

const selectClassName = cn(
    inputVariants({ size: 'compact' }),
    'cursor-pointer appearance-auto'
);

export function InviteLinkCreateForm({
    serverId,
    activeLinkCount,
    onCreated,
}: InviteLinkCreateFormProps) {
    const maxUsesId = useId();
    const expiryId = useId();
    const [maxUses, setMaxUses] = useState<number>(
        DEFAULT_INVITE_LINK_MAX_USES
    );
    const [expiresInHours, setExpiresInHours] = useState<number>(
        DEFAULT_INVITE_LINK_EXPIRY_HOURS
    );
    const [errorMessage, setErrorMessage] = useState('');
    const { mutate: createLink, isPending } = useCreateInviteLinkMutation();

    const isLimitReached = activeLinkCount >= MAX_ACTIVE_INVITE_LINKS;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        createLink(
            { serverId, maxUses, expiresInHours },
            {
                onSuccess: ({ inviteUrl }) => {
                    if (inviteUrl) onCreated(inviteUrl);
                },
                onError: (error) =>
                    setErrorMessage(
                        getApiErrorMessage(
                            error,
                            {
                                403: 'Chỉ chủ server mới có thể tạo link mời.',
                                409: `Server đã có ${MAX_ACTIVE_INVITE_LINKS} link còn hiệu lực. Hãy thu hồi một link trước.`,
                            },
                            'Không thể tạo link mời. Vui lòng thử lại.'
                        )
                    ),
            }
        );
    }

    return (
        <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label
                        className="mb-1.5 block text-sm font-semibold text-foreground"
                        htmlFor={maxUsesId}
                    >
                        Số người tối đa
                    </label>
                    <select
                        className={selectClassName}
                        disabled={isPending || isLimitReached}
                        id={maxUsesId}
                        onChange={(event) =>
                            setMaxUses(Number(event.target.value))
                        }
                        value={maxUses}
                    >
                        {INVITE_LINK_MAX_USES_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option} người
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label
                        className="mb-1.5 block text-sm font-semibold text-foreground"
                        htmlFor={expiryId}
                    >
                        Thời hạn
                    </label>
                    <select
                        className={selectClassName}
                        disabled={isPending || isLimitReached}
                        id={expiryId}
                        onChange={(event) =>
                            setExpiresInHours(Number(event.target.value))
                        }
                        value={expiresInHours}
                    >
                        {INVITE_LINK_EXPIRY_OPTIONS.map((option) => (
                            <option key={option.hours} value={option.hours}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {errorMessage && (
                <p className="text-sm text-feedback-danger" role="alert">
                    {errorMessage}
                </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-caption text-muted">
                    {isLimitReached
                        ? `Đã đạt tối đa ${MAX_ACTIVE_INVITE_LINKS} link. Thu hồi một link để tạo mới.`
                        : `Đang dùng ${activeLinkCount}/${MAX_ACTIVE_INVITE_LINKS} link.`}
                </p>
                <Button
                    disabled={isPending || isLimitReached}
                    size="compact"
                    type="submit"
                >
                    <Link2 aria-hidden="true" className="size-4" />
                    {isPending ? 'Đang tạo...' : 'Tạo link mời'}
                </Button>
            </div>
        </form>
    );
}
