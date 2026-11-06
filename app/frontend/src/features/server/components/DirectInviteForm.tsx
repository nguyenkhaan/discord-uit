import { Mail, Search, Send, UserRound } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
    useCreateDirectInviteMutation,
    useLookupUserMutation,
} from '@/features/server/server-invite.hooks';
import type { UserLookupResponse } from '@/features/server/server.type';
import { getApiErrorMessage } from '@/lib/api-error';
import { showToast } from '@/lib/toast';

interface DirectInviteFormProps {
    serverId: string;
}

export function DirectInviteForm({ serverId }: DirectInviteFormProps) {
    const emailId = useId();
    const [email, setEmail] = useState('');
    const [recipient, setRecipient] = useState<UserLookupResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const lookupUser = useLookupUserMutation();
    const sendInvite = useCreateDirectInviteMutation();

    function handleEmailChange(value: string) {
        setEmail(value);
        // Email đổi thì kết quả tìm cũ không còn đúng
        setRecipient(null);
        setErrorMessage('');
    }

    function handleLookup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return;
        setErrorMessage('');
        lookupUser.mutate(trimmedEmail, {
            onSuccess: setRecipient,
            onError: (error) =>
                setErrorMessage(
                    getApiErrorMessage(
                        error,
                        {
                            400: 'Email không hợp lệ.',
                            404: 'Không tìm thấy tài khoản đang hoạt động với email này.',
                        },
                        'Không thể tìm người dùng. Vui lòng thử lại.'
                    )
                ),
        });
    }

    function handleSendInvite() {
        const recipientId = recipient?.userId;
        if (!recipientId) return;
        setErrorMessage('');
        sendInvite.mutate(
            { serverId, recipientId },
            {
                onSuccess: () => {
                    showToast(
                        `Đã gửi lời mời tới ${recipient.fullName || recipient.email || 'người dùng'}.`
                    );
                    setEmail('');
                    setRecipient(null);
                },
                onError: (error) =>
                    setErrorMessage(
                        getApiErrorMessage(
                            error,
                            {
                                403: 'Chỉ chủ server mới có thể gửi lời mời.',
                                404: 'Không tìm thấy người nhận.',
                                409: 'Người này đã là thành viên hoặc đang có lời mời chờ phản hồi.',
                            },
                            'Không thể gửi lời mời. Vui lòng thử lại.'
                        )
                    ),
            }
        );
    }

    return (
        <div className="space-y-4">
            <form className="space-y-1.5" onSubmit={handleLookup}>
                <label
                    className="block text-sm font-semibold text-foreground"
                    htmlFor={emailId}
                >
                    Email người nhận
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="min-w-0 flex-1">
                        <Input
                            autoComplete="off"
                            id={emailId}
                            onChange={(event) =>
                                handleEmailChange(event.target.value)
                            }
                            placeholder="vidu@gmail.com"
                            size="compact"
                            startIcon={<Mail className="size-4" />}
                            status={errorMessage ? 'error' : 'default'}
                            type="email"
                            value={email}
                        />
                    </div>
                    <Button
                        disabled={!email.trim() || lookupUser.isPending}
                        size="compact"
                        type="submit"
                        variant="secondary"
                    >
                        <Search aria-hidden="true" className="size-4" />
                        {lookupUser.isPending ? 'Đang tìm...' : 'Tìm'}
                    </Button>
                </div>
                <p className="text-caption text-muted">
                    Nhập chính xác email tài khoản. Người nhận sẽ thấy lời mời
                    trong chuông thông báo.
                </p>
            </form>

            {errorMessage && (
                <p className="text-sm text-feedback-danger" role="alert">
                    {errorMessage}
                </p>
            )}

            {recipient && (
                <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-subtle p-3 sm:flex-row sm:items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                        <UserRound aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-heading">
                            {recipient.fullName || 'Chưa đặt tên'}
                        </p>
                        <p className="truncate text-caption text-muted">
                            {recipient.email}
                        </p>
                    </div>
                    <Button
                        disabled={sendInvite.isPending}
                        onClick={handleSendInvite}
                        size="compact"
                    >
                        <Send aria-hidden="true" className="size-4" />
                        {sendInvite.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
                    </Button>
                </div>
            )}
        </div>
    );
}
