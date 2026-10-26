import { Bell, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { NotificationCard } from '@/components/layout/Header/NotificationCard';
import {
    NotificationEmptyState,
    NotificationErrorState,
    NotificationLoadingState,
} from '@/components/layout/Header/NotificationPanelStates';
import {
    useDeleteNotificationMutation,
    useGetNotifications,
    useMarkAsReadMutation,
    useUnreadNotificationCount,
} from '@/features/notification/notification.hooks';

const MAX_VISIBLE_BADGE_COUNT = 99;

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const notificationsQuery = useGetNotifications({ enabled: isOpen });
    const unreadCountQuery = useUnreadNotificationCount();
    const markAsReadMutation = useMarkAsReadMutation();
    const deleteNotificationMutation = useDeleteNotificationMutation();

    const notifications = notificationsQuery.data?.notifications ?? [];
    const unreadCount =
        unreadCountQuery.data?.unreadCount ??
        notifications.filter((notification) => !notification.readAt).length;
    const badgeLabel =
        unreadCount > MAX_VISIBLE_BADGE_COUNT
            ? `${MAX_VISIBLE_BADGE_COUNT}+`
            : String(unreadCount);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function closeOnOutsideClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <Button
                aria-controls="notification-panel"
                aria-expanded={isOpen}
                aria-label={
                    unreadCount > 0
                        ? `Thông báo, ${unreadCount} chưa đọc`
                        : 'Thông báo'
                }
                className="relative size-10 min-h-10 text-foreground-secondary hover:bg-brand-subtle hover:text-brand"
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                size="icon"
                variant="ghost"
            >
                <Bell className="size-5 cursor-pointer" strokeWidth={1.8} />
                {unreadCount > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-surface bg-feedback-danger px-1 text-[0.625rem] leading-none font-bold text-white"
                    >
                        {badgeLabel}
                    </span>
                )}
            </Button>

            {isOpen && (
                <section
                    aria-label="Danh sách thông báo"
                    className="absolute top-full -right-14 z-50 mt-3 flex max-h-[min(36rem,calc(100vh-5rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-auth-card sm:right-0"
                    id="notification-panel"
                >
                    <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-heading">
                                Thông báo
                            </h2>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-caption font-bold text-brand">
                                    {badgeLabel} mới
                                </span>
                            )}
                        </div>
                        <Button
                            aria-label="Đóng danh sách thông báo"
                            className="size-8 cursor-pointer min-h-8"
                            onClick={() => {
                                setIsOpen(false);
                                triggerRef.current?.focus();
                            }}
                            size="icon"
                            variant="ghost"
                        >
                            <X className="size-4.5" />
                        </Button>
                    </header>

                    <div className="min-h-0 overflow-y-auto bg-surface">
                        {notificationsQuery.isLoading ? (
                            <NotificationLoadingState />
                        ) : notificationsQuery.isError ? (
                            <NotificationErrorState
                                onRetry={() =>
                                    void notificationsQuery.refetch()
                                }
                            />
                        ) : notifications.length === 0 ? (
                            <NotificationEmptyState />
                        ) : (
                            <ul role="list">
                                {notifications.map((notification, index) => (
                                    <li
                                        className="border-b border-line-subtle last:border-b-0"
                                        key={
                                            notification.id ??
                                            `${notification.createdAt}-${index}`
                                        }
                                    >
                                        <NotificationCard
                                            isDeleting={
                                                deleteNotificationMutation.isPending
                                            }
                                            isMarkingAsRead={
                                                markAsReadMutation.isPending
                                            }
                                            notification={notification}
                                            onDelete={(notificationId) =>
                                                deleteNotificationMutation.mutate(
                                                    notificationId
                                                )
                                            }
                                            onMarkAsRead={(notificationId) =>
                                                markAsReadMutation.mutate(
                                                    notificationId
                                                )
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
