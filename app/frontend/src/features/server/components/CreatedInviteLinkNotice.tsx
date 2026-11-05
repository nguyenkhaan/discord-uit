import { CopyButton } from '@/components/common/CopyButton';

interface CreatedInviteLinkNoticeProps {
    inviteUrl: string;
}

export function CreatedInviteLinkNotice({
    inviteUrl,
}: CreatedInviteLinkNoticeProps) {
    return (
        <section
            aria-label="Link mời vừa tạo"
            className="rounded-xl border border-line-brand bg-brand-subtle p-3"
        >
            <p className="text-sm font-semibold text-heading">
                Link mời đã được tạo
            </p>
            <p className="mt-0.5 text-caption text-muted">
                Vì lý do bảo mật, link chỉ hiển thị một lần. Hãy sao chép trước
                khi đóng cửa sổ này.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                    aria-label="Link mời"
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-sm text-foreground"
                    onFocus={(event) => event.currentTarget.select()}
                    readOnly
                    value={inviteUrl}
                />
                <CopyButton value={inviteUrl} />
            </div>
        </section>
    );
}
