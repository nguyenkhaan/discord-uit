import { LoaderCircle, TriangleAlert, WifiOff } from 'lucide-react';

import { Button } from '@/components/common/Button';
import type { ChatConnectionStatus } from '@/features/chat/chat.type';
import { cn } from '@/lib/utils';

interface ChatConnectionBannerProps {
    status: ChatConnectionStatus;
    onReconnect: () => void;
}

const BANNERS: Record<
    Exclude<ChatConnectionStatus, 'joined'>,
    { message: string; tone: 'info' | 'danger'; canRetry: boolean }
> = {
    connecting: {
        message: 'Đang kết nối tới phòng chat...',
        tone: 'info',
        canRetry: false,
    },
    reconnecting: {
        message: 'Mất kết nối. Đang thử kết nối lại...',
        tone: 'info',
        canRetry: true,
    },
    'not-member': {
        message:
            'Bạn không phải thành viên của server này nên không thể nhắn tin.',
        tone: 'danger',
        canRetry: false,
    },
    unauthenticated: {
        message:
            'Phiên đăng nhập đã hết hạn. Hãy tải lại trang hoặc đăng nhập lại.',
        tone: 'danger',
        canRetry: true,
    },
    error: {
        message: 'Không kết nối được tới phòng chat.',
        tone: 'danger',
        canRetry: true,
    },
};

export function ChatConnectionBanner({
    status,
    onReconnect,
}: ChatConnectionBannerProps) {
    if (status === 'joined') return null;

    const banner = BANNERS[status];
    const Icon =
        status === 'connecting'
            ? LoaderCircle
            : banner.tone === 'danger'
              ? TriangleAlert
              : WifiOff;

    return (
        <div
            className={cn(
                'flex items-center gap-2 border-b px-4 py-2 text-body-sm',
                banner.tone === 'danger'
                    ? 'border-feedback-danger-border/30 bg-danger-subtle text-feedback-danger'
                    : 'border-line-brand bg-brand-subtle text-brand'
            )}
            role="status"
        >
            <Icon
                aria-hidden="true"
                className={cn(
                    'size-4 shrink-0',
                    status === 'connecting' && 'animate-spin'
                )}
            />
            <span className="flex-1">{banner.message}</span>
            {banner.canRetry && (
                <Button
                    className="min-h-8 px-3 text-xs"
                    onClick={onReconnect}
                    size="compact"
                    variant="secondary"
                >
                    Thử lại
                </Button>
            )}
        </div>
    );
}
