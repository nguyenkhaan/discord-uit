import { Menu, Search } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AdminAccountMenu } from '@/features/admin/components/AdminAccountMenu';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { showToast } from '@/lib/toast';

interface AdminHeaderProps {
    isMenuOpen: boolean;
    onMenuClick: () => void;
}

export function AdminHeader({ isMenuOpen, onMenuClick }: AdminHeaderProps) {
    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        showToast('Tìm kiếm toàn hệ thống đang được phát triển.');
    }

    return (
        <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-line-subtle bg-page/90 px-4 backdrop-blur sm:px-6 lg:border-b-0">
            <Button
                aria-controls="admin-sidebar"
                aria-expanded={isMenuOpen}
                aria-label="Mở menu quản trị"
                className="shrink-0 lg:hidden"
                id="admin-menu-trigger"
                onClick={onMenuClick}
                size="icon"
                variant="ghost"
            >
                <Menu aria-hidden="true" className="size-5" />
            </Button>

            <form
                className="ml-auto w-full max-w-sm"
                onSubmit={handleSearch}
                role="search"
            >
                <Input
                    aria-label="Tìm kiếm trong trang quản trị"
                    className="h-11"
                    placeholder="Tìm kiếm báo cáo, người dùng, nội dung..."
                    size="compact"
                    startIcon={<Search className="size-4" />}
                    type="search"
                />
            </form>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <NotificationBell />
                <AdminAccountMenu />
            </div>
        </header>
    );
}
