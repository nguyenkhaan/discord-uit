import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Archive,
    ArchiveRestore,
    ChevronLeft,
    ChevronRight,
    EllipsisVertical,
    Eye,
    Lock,
    LockOpen,
    Pencil,
    SearchX,
    ServerOff,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';

import { ServerAvatar } from '@/features/server/components/ServerAvatar';
import { getServerStatus, SERVER_STATUS_META } from '@/features/server/server.status';
import type { ServerMemberRole, ServerResponse, ServerStatus } from '@/features/server/server.type';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export interface ServerTableListProps {
    servers: ServerResponse[];
    isLoading: boolean;
    /** true khi người dùng đang tìm kiếm / lọc, để hiển thị đúng trạng thái rỗng */
    isFiltering?: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    /** Mở modal mời thành viên; chỉ hiển thị với OWNER */
    onInviteMembers?: (server: ServerResponse) => void;
}

const ITEMS_PER_PAGE = 8;
const MENU_WIDTH = 176;
const MENU_HEIGHT = 270;
const COLUMN_COUNT = 9;

type ServerActionKey = 'view' | 'invite' | 'edit' | 'lock' | 'unlock' | 'close' | 'reopen' | 'delete';
type ServerActionTone = 'default' | 'success' | 'warning' | 'danger';

type ServerAction = {
    key: ServerActionKey;
    label: string;
    icon: LucideIcon;
    tone: ServerActionTone;
    dividerBefore?: boolean;
};

const VIEW_ACTION: ServerAction = { key: 'view', label: 'Xem chi tiết', icon: Eye, tone: 'default' };
const INVITE_ACTION: ServerAction = { key: 'invite', label: 'Mời thành viên', icon: UserPlus, tone: 'default' };
const EDIT_ACTION: ServerAction = { key: 'edit', label: 'Chỉnh sửa', icon: Pencil, tone: 'default' };
const LOCK_ACTION: ServerAction = { key: 'lock', label: 'Khóa server', icon: Lock, tone: 'danger' };
const UNLOCK_ACTION: ServerAction = { key: 'unlock', label: 'Mở khóa server', icon: LockOpen, tone: 'success' };
const CLOSE_ACTION: ServerAction = { key: 'close', label: 'Đóng server', icon: Archive, tone: 'warning' };
const REOPEN_ACTION: ServerAction = { key: 'reopen', label: 'Mở lại server', icon: ArchiveRestore, tone: 'success' };
const DELETE_ACTION: ServerAction = { key: 'delete', label: 'Xóa server', icon: Trash2, tone: 'danger', dividerBefore: true };

/** Các thao tác chuyển trạng thái hợp lệ theo trạng thái hiện tại của server */
const STATUS_ACTIONS: Record<ServerStatus, ServerAction[]> = {
    ACTIVE: [LOCK_ACTION, CLOSE_ACTION],
    LOCKED: [UNLOCK_ACTION, CLOSE_ACTION],
    CLOSED: [REOPEN_ACTION],
};

function getServerActions(server: ServerResponse): ServerAction[] {
    const [firstStatusAction, ...restStatusActions] = STATUS_ACTIONS[getServerStatus(server)];
    return [
        VIEW_ACTION,
        ...(server.myRole === 'OWNER' ? [INVITE_ACTION] : []),
        EDIT_ACTION,
        { ...firstStatusAction, dividerBefore: true },
        ...restStatusActions,
        DELETE_ACTION,
    ];
}

const ACTION_TONE_CLASSES: Record<ServerActionTone, string> = {
    default: 'text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100',
    success: 'text-emerald-600 hover:bg-emerald-100/70 focus-visible:bg-emerald-100/70',
    warning: 'text-amber-600 hover:bg-amber-100/70 focus-visible:bg-amber-100/70',
    danger: 'text-red-600 hover:bg-red-100/70 focus-visible:bg-red-100/70',
};

function ServerStatusBadge({ status }: { status: ServerStatus }) {
    const meta = SERVER_STATUS_META[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ring-1 ring-inset',
                meta.badgeClass
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', meta.dotClass)} />
            {meta.label}
        </span>
    );
}

type MenuState = { serverId: string; left: number; top?: number; bottom?: number };

/** Tạo danh sách số trang rút gọn, ví dụ: 1 … 4 5 6 … 20 */
function getPageItems(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const items: (number | 'ellipsis')[] = [];
    sorted.forEach((page, i) => {
        if (i > 0 && page - sorted[i - 1] > 1) items.push('ellipsis');
        items.push(page);
    });
    return items;
}

const SERVER_ROLE_META: Record<ServerMemberRole, { label: string; className: string }> = {
    OWNER: { label: 'Chủ server', className: 'text-violet-700 bg-violet-50' },
    MEMBER: { label: 'Thành viên', className: 'text-gray-600 bg-gray-100' },
};

function ServerRoleBadge({ role }: { role: ServerMemberRole | undefined }) {
    if (!role) return <span className="text-gray-400">—</span>;
    const meta = SERVER_ROLE_META[role];
    return (
        <span className={cn('px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap', meta.className)}>
            {meta.label}
        </span>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-4 h-4 mx-auto rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-4 h-3 mx-auto rounded bg-gray-200" /></td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200" />
                            <div className="space-y-2">
                                <div className="w-36 h-3 rounded bg-gray-200" />
                                <div className="w-24 h-2.5 rounded bg-gray-100" />
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3"><div className="w-24 h-3 rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-14 h-5 mx-auto rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-8 h-3 mx-auto rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-20 h-3 rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-16 h-3 rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="w-6 h-6 ml-auto rounded bg-gray-200" /></td>
                </tr>
            ))}
        </>
    );
}

export const ServerTableList = ({
    servers,
    isLoading,
    isFiltering = false,
    currentPage,
    onPageChange,
    onInviteMembers,
}: ServerTableListProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [menu, setMenu] = useState<MenuState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const totalItems = servers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    // Không để trang hiện tại vượt quá tổng số trang (ví dụ sau khi tìm kiếm)
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const currentServers = servers.slice(startIndex, endIndex);

    const pageIds = currentServers.map((s) => s.id).filter((id): id is string => Boolean(id));
    const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const isSomePageSelected = pageIds.some((id) => selectedIds.has(id));

    // Đóng dropdown khi click ra ngoài, nhấn Esc, cuộn hoặc đổi kích thước cửa sổ
    useEffect(() => {
        if (!menu) return;

        const handlePointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            setMenu(null);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenu(null);
                triggerRef.current?.focus();
            }
        };
        const close = () => setMenu(null);

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [menu]);

    const toggleMenu = (serverId: string, button: HTMLButtonElement) => {
        if (menu?.serverId === serverId) {
            setMenu(null);
            return;
        }
        // Dùng position: fixed để menu không bị cắt bởi overflow của bảng,
        // tự lật lên trên nếu không đủ chỗ phía dưới.
        const rect = button.getBoundingClientRect();
        const openUpward = window.innerHeight - rect.bottom < MENU_HEIGHT && rect.top > MENU_HEIGHT;
        triggerRef.current = button;
        setMenu({
            serverId,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
            left: Math.max(8, rect.right - MENU_WIDTH),
        });
    };

    const handleAction = (action: ServerAction, server: ServerResponse) => {
        setMenu(null);
        if (action.key === 'invite' && onInviteMembers) {
            onInviteMembers(server);
            return;
        }
        showToast(`Chức năng "${action.label}" cho server "${server.name ?? ''}" đang được phát triển.`);
    };

    const toggleSelectAllOnPage = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isAllPageSelected) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const goToPage = (target: number) => {
        setMenu(null);
        onPageChange(Math.min(Math.max(target, 1), totalPages));
    };

    const activeServer = menu ? servers.find((s) => s.id === menu.serverId) : undefined;

    const renderEmptyState = () => (
        <tr>
            <td colSpan={COLUMN_COUNT} className="px-4 py-14">
                <div className="flex flex-col items-center text-center text-gray-500">
                    {isFiltering ? (
                        <>
                            <SearchX className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="font-medium text-gray-700">Không tìm thấy server phù hợp</p>
                            <p className="text-sm mt-1">Hãy thử từ khóa hoặc bộ lọc khác.</p>
                        </>
                    ) : (
                        <>
                            <ServerOff className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="font-medium text-gray-700">Chưa có server nào</p>
                            <p className="text-sm mt-1">Nhấn "Thêm server" để tạo server đầu tiên.</p>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {selectedIds.size > 0 && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-700 flex items-center justify-between">
                    <span>Đã chọn {selectedIds.size} server</span>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="font-medium hover:underline cursor-pointer"
                    >
                        Bỏ chọn
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">
                                <input
                                    type="checkbox"
                                    aria-label="Chọn tất cả server trên trang"
                                    checked={isAllPageSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = !isAllPageSelected && isSomePageSelected;
                                    }}
                                    onChange={toggleSelectAllOnPage}
                                    disabled={isLoading || pageIds.length === 0}
                                    className="rounded text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                />
                            </th>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3 min-w-55">Thông tin server</th>
                            <th className="px-4 py-3 whitespace-nowrap">Vai trò của bạn</th>
                            <th className="px-4 py-3 text-center whitespace-nowrap">Lĩnh vực</th>
                            <th className="px-4 py-3 text-center whitespace-nowrap">Thành viên</th>
                            <th className="px-4 py-3 whitespace-nowrap">Ngày tạo</th>
                            <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <SkeletonRows />
                        ) : currentServers.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            currentServers.map((server, idx) => {
                                const isSelected = !!server.id && selectedIds.has(server.id);
                                const isMenuOpen = !!server.id && menu?.serverId === server.id;
                                return (
                                    <tr
                                        key={server.id ?? idx}
                                        className={cn(
                                            'transition-colors',
                                            isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                aria-label={`Chọn server ${server.name ?? ''}`}
                                                checked={isSelected}
                                                onChange={() => server.id && toggleSelect(server.id)}
                                                className="rounded text-blue-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-400">{startIndex + idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <ServerAvatar name={server.name} imageUrl={server.groupImageUrl} />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 line-clamp-1" title={server.name}>
                                                        {server.name || 'Chưa đặt tên'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 line-clamp-1">Mô tả server đang cập nhật...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ServerRoleBadge role={server.myRole} />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs whitespace-nowrap">Học tập</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 font-medium">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                {(server.memberCount ?? 0).toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {server.createdAt ? new Date(server.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ServerStatusBadge status={getServerStatus(server)} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                aria-label={`Thao tác với server ${server.name ?? ''}`}
                                                aria-haspopup="menu"
                                                aria-expanded={isMenuOpen}
                                                disabled={!server.id}
                                                onClick={(e) => server.id && toggleMenu(server.id, e.currentTarget)}
                                                className={cn(
                                                    'inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors',
                                                    'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                                                    'disabled:cursor-not-allowed disabled:opacity-50',
                                                    isMenuOpen && 'bg-gray-100 text-gray-700'
                                                )}
                                            >
                                                <EllipsisVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {!isLoading && totalItems > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 bg-white">
                    <span>
                        Hiển thị <span className="font-medium text-gray-700">{startIndex + 1}</span> -{' '}
                        <span className="font-medium text-gray-700">{endIndex}</span> của{' '}
                        <span className="font-medium text-gray-700">{totalItems}</span> server
                    </span>
                    <nav aria-label="Phân trang" className="flex items-center gap-1">
                        <button
                            type="button"
                            aria-label="Trang trước"
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {getPageItems(page, totalPages).map((item, i) =>
                            item === 'ellipsis' ? (
                                <span key={`ellipsis-${i}`} className="w-8 text-center select-none">…</span>
                            ) : (
                                <button
                                    type="button"
                                    key={item}
                                    onClick={() => goToPage(item)}
                                    aria-current={page === item ? 'page' : undefined}
                                    className={cn(
                                        'min-w-8 h-8 px-2 rounded-lg font-medium cursor-pointer transition-colors',
                                        page === item ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'
                                    )}
                                >
                                    {item}
                                </button>
                            )
                        )}

                        <button
                            type="button"
                            aria-label="Trang sau"
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </nav>
                </div>
            )}

            {/* Dropdown thao tác (fixed để không bị cắt bởi overflow của bảng) */}
            {menu && activeServer && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ top: menu.top, bottom: menu.bottom, left: menu.left, width: MENU_WIDTH }}
                    className="fixed z-50 py-1 bg-white rounded-lg shadow-lg border border-gray-100 text-left animate-in fade-in zoom-in duration-100"
                >
                    {getServerActions(activeServer).map((action) => {
                        const Icon = action.icon;
                        return (
                            <div key={action.key}>
                                {action.dividerBefore && <hr className="border-gray-100 my-1" />}
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleAction(action, activeServer)}
                                    className={cn(
                                        'w-full px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none',
                                        ACTION_TONE_CLASSES[action.tone],
                                        action.key === 'delete' && 'font-medium'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {action.label}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
