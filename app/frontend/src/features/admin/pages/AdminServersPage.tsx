import {
    Eye,
    Lock,
    LockOpen,
    Pause,
    Pencil,
    Play,
    Plus,
    ServerOff,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { mockServers, serverStats } from '@/features/admin/admin.mock';
import { useRowSelection } from '@/features/admin/admin.hooks';
import {
    SERVER_CATEGORY_ICON,
    SERVER_CATEGORY_META,
    SERVER_STATUS_META,
} from '@/features/admin/admin.meta';
import type {
    AdminSelectOption,
    AdminServer,
    AdminServerCategory,
    AdminServerStatus,
} from '@/features/admin/admin.type';
import {
    formatAdminDate,
    formatAdminNumber,
    paginate,
    toTimestamp,
} from '@/features/admin/admin.utils';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminFilterSelect } from '@/features/admin/components/AdminFilterSelect';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { AdminPersonCell } from '@/features/admin/components/AdminPersonCell';
import {
    AdminRowMenu,
    type AdminRowMenuItem,
} from '@/features/admin/components/AdminRowMenu';
import { AdminSelectAllCheckbox } from '@/features/admin/components/AdminSelectAllCheckbox';
import { AdminStatGrid } from '@/features/admin/components/AdminStatCard';
import { AdminTableToolbar } from '@/features/admin/components/AdminTableToolbar';
import {
    AdminEmptyRow,
    AdminSelectionBar,
} from '@/features/admin/components/AdminTableStates';
import {
    ADMIN_CHECKBOX_CLASS,
    ADMIN_TD_CLASS,
    ADMIN_TH_CLASS,
} from '@/features/admin/components/adminVariants';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 8;
const COLUMN_COUNT = 9;

type StatusFilter = 'ALL' | AdminServerStatus;
type CategoryFilter = 'ALL' | AdminServerCategory;
type SortOrder = 'NEWEST' | 'OLDEST' | 'MOST_MEMBERS';

const STATUS_OPTIONS: AdminSelectOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(SERVER_STATUS_META).map(([value, meta]) => ({
        value: value as AdminServerStatus,
        label: meta.label,
    })),
];

const CATEGORY_OPTIONS: AdminSelectOption<CategoryFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(SERVER_CATEGORY_META).map(([value, meta]) => ({
        value: value as AdminServerCategory,
        label: meta.label,
    })),
];

const SORT_OPTIONS: AdminSelectOption<SortOrder>[] = [
    { value: 'NEWEST', label: 'Mới nhất' },
    { value: 'OLDEST', label: 'Cũ nhất' },
    { value: 'MOST_MEMBERS', label: 'Nhiều thành viên' },
];

const SORTERS: Record<SortOrder, (a: AdminServer, b: AdminServer) => number> = {
    NEWEST: (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt),
    OLDEST: (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
    MOST_MEMBERS: (a, b) => b.memberCount - a.memberCount,
};

function matchesSearch(server: AdminServer, query: string): boolean {
    if (!query) return true;
    return [server.name, server.ownerName, server.description].some((value) =>
        value.toLowerCase().includes(query)
    );
}

export default function AdminServersPage() {
    const [servers, setServers] = useState<AdminServer[]>(mockServers);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
    const [currentPage, setCurrentPage] = useState(1);
    const [serverToDelete, setServerToDelete] = useState<AdminServer | null>(
        null
    );

    function withPageReset<T>(setter: (value: T) => void) {
        return (value: T) => {
            setter(value);
            setCurrentPage(1);
        };
    }

    const filteredServers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return servers
            .filter(
                (server) =>
                    matchesSearch(server, query) &&
                    (statusFilter === 'ALL' ||
                        server.status === statusFilter) &&
                    (categoryFilter === 'ALL' ||
                        server.category === categoryFilter)
            )
            .sort(SORTERS[sortOrder]);
    }, [servers, searchTerm, statusFilter, categoryFilter, sortOrder]);

    const pageSlice = paginate(filteredServers, currentPage, PAGE_SIZE);
    const selection = useRowSelection(
        pageSlice.items.map((server) => server.id)
    );
    const isFiltering =
        searchTerm.trim() !== '' ||
        statusFilter !== 'ALL' ||
        categoryFilter !== 'ALL';

    function updateStatus(
        server: AdminServer,
        status: AdminServerStatus,
        message: string
    ) {
        setServers((previous) =>
            previous.map((item) =>
                item.id === server.id ? { ...item, status } : item
            )
        );
        showToast(message);
    }

    function showComingSoon(action: string, server: AdminServer) {
        showToast(
            `Chức năng "${action}" cho server "${server.name}" đang được phát triển.`
        );
    }

    function getMenuItems(server: AdminServer): AdminRowMenuItem[] {
        const items: AdminRowMenuItem[] = [
            {
                key: 'view',
                label: 'Xem chi tiết',
                icon: Eye,
                onSelect: () => showComingSoon('Xem chi tiết', server),
            },
            {
                key: 'edit',
                label: 'Chỉnh sửa',
                icon: Pencil,
                onSelect: () => showComingSoon('Chỉnh sửa', server),
            },
        ];

        if (server.status === 'ACTIVE') {
            items.push(
                {
                    key: 'suspend',
                    label: 'Tạm ngừng',
                    icon: Pause,
                    dividerBefore: true,
                    onSelect: () =>
                        updateStatus(
                            server,
                            'SUSPENDED',
                            `Đã tạm ngừng server "${server.name}".`
                        ),
                },
                {
                    key: 'lock',
                    label: 'Khóa server',
                    icon: Lock,
                    tone: 'danger',
                    onSelect: () =>
                        updateStatus(
                            server,
                            'LOCKED',
                            `Đã khóa server "${server.name}".`
                        ),
                }
            );
        } else if (server.status === 'SUSPENDED') {
            items.push(
                {
                    key: 'resume',
                    label: 'Kích hoạt lại',
                    icon: Play,
                    tone: 'success',
                    dividerBefore: true,
                    onSelect: () =>
                        updateStatus(
                            server,
                            'ACTIVE',
                            `Đã kích hoạt lại server "${server.name}".`
                        ),
                },
                {
                    key: 'lock',
                    label: 'Khóa server',
                    icon: Lock,
                    tone: 'danger',
                    onSelect: () =>
                        updateStatus(
                            server,
                            'LOCKED',
                            `Đã khóa server "${server.name}".`
                        ),
                }
            );
        } else {
            items.push({
                key: 'unlock',
                label: 'Mở khóa server',
                icon: LockOpen,
                tone: 'success',
                dividerBefore: true,
                onSelect: () =>
                    updateStatus(
                        server,
                        'ACTIVE',
                        `Đã mở khóa server "${server.name}".`
                    ),
            });
        }

        items.push({
            key: 'delete',
            label: 'Xóa server',
            icon: Trash2,
            tone: 'danger',
            dividerBefore: true,
            onSelect: () => setServerToDelete(server),
        });

        return items;
    }

    function deleteServer(server: AdminServer) {
        setServers((previous) =>
            previous.filter((item) => item.id !== server.id)
        );
        showToast(`Đã xóa server "${server.name}".`);
    }

    return (
        <>
            <AdminPageHeader
                description="Quản lý thông tin các server cộng đồng trên UIT Connect."
                title="Quản lý server"
            />

            <AdminStatGrid stats={serverStats} />

            <section
                aria-label="Danh sách server"
                className="rounded-xl border border-line-subtle bg-surface shadow-soft"
            >
                <AdminTableToolbar
                    action={
                        <Button
                            className="w-full sm:w-auto"
                            onClick={() =>
                                showToast(
                                    'Chức năng "Thêm server" đang được phát triển.'
                                )
                            }
                            size="compact"
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Thêm server
                        </Button>
                    }
                    filters={
                        <>
                            <AdminFilterSelect
                                label="Trạng thái"
                                onChange={withPageReset(setStatusFilter)}
                                options={STATUS_OPTIONS}
                                value={statusFilter}
                            />
                            <AdminFilterSelect
                                label="Lĩnh vực"
                                onChange={withPageReset(setCategoryFilter)}
                                options={CATEGORY_OPTIONS}
                                value={categoryFilter}
                            />
                            <AdminFilterSelect
                                label="Sắp xếp"
                                onChange={withPageReset(setSortOrder)}
                                options={SORT_OPTIONS}
                                value={sortOrder}
                            />
                        </>
                    }
                    onSearchChange={withPageReset(setSearchTerm)}
                    searchLabel="Tìm kiếm server"
                    searchPlaceholder="Tìm kiếm server, chủ server, mô tả..."
                    searchValue={searchTerm}
                />

                <AdminSelectionBar
                    count={selection.selectedIds.size}
                    itemLabel="server"
                    onClear={selection.clear}
                />

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse">
                        <thead className="bg-surface-subtle/60">
                            <tr>
                                <th
                                    className={cn(ADMIN_TH_CLASS, 'w-12 pl-5')}
                                    scope="col"
                                >
                                    <AdminSelectAllCheckbox
                                        checked={selection.isAllPageSelected}
                                        indeterminate={
                                            selection.isSomePageSelected
                                        }
                                        onChange={selection.togglePage}
                                    />
                                </th>
                                <th
                                    className={cn(
                                        ADMIN_TH_CLASS,
                                        'w-12 text-center'
                                    )}
                                    scope="col"
                                >
                                    #
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Thông tin server
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Chủ server
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Lĩnh vực
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Thành viên
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Ngày tạo
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Trạng thái
                                </th>
                                <th
                                    className={cn(
                                        ADMIN_TH_CLASS,
                                        'pr-5 text-center'
                                    )}
                                    scope="col"
                                >
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line-subtle">
                            {pageSlice.items.length === 0 ? (
                                <AdminEmptyRow
                                    colSpan={COLUMN_COUNT}
                                    emptyIcon={ServerOff}
                                    emptyTitle="Chưa có server nào"
                                    isFiltering={isFiltering}
                                />
                            ) : (
                                pageSlice.items.map((server, index) => {
                                    const category =
                                        SERVER_CATEGORY_META[server.category];
                                    const status =
                                        SERVER_STATUS_META[server.status];
                                    const ServerIcon =
                                        SERVER_CATEGORY_ICON[server.category];
                                    const isSelected =
                                        selection.selectedIds.has(server.id);

                                    return (
                                        <tr
                                            className={cn(
                                                'transition-colors hover:bg-surface-subtle/60',
                                                isSelected &&
                                                    'bg-brand-subtle/60'
                                            )}
                                            key={server.id}
                                        >
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'pl-5'
                                                )}
                                            >
                                                <input
                                                    aria-label={`Chọn server ${server.name}`}
                                                    checked={isSelected}
                                                    className={
                                                        ADMIN_CHECKBOX_CLASS
                                                    }
                                                    onChange={() =>
                                                        selection.toggle(
                                                            server.id
                                                        )
                                                    }
                                                    type="checkbox"
                                                />
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-center text-sm text-foreground-secondary tabular-nums'
                                                )}
                                            >
                                                {pageSlice.start + index + 1}
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <div className="flex w-64 items-center gap-3">
                                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-panel text-on-brand">
                                                        <ServerIcon
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">
                                                            {server.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted">
                                                            {server.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminPersonCell
                                                    name={server.ownerName}
                                                />
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminBadge
                                                    tone={category.tone}
                                                >
                                                    {category.label}
                                                </AdminBadge>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <span className="inline-flex items-center gap-2 text-sm text-foreground-secondary tabular-nums">
                                                    <Users
                                                        aria-hidden="true"
                                                        className="size-4 text-muted"
                                                    />
                                                    {formatAdminNumber(
                                                        server.memberCount
                                                    )}
                                                    <span className="sr-only">
                                                        thành viên
                                                    </span>
                                                </span>
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-sm text-foreground-secondary tabular-nums'
                                                )}
                                            >
                                                <time
                                                    dateTime={server.createdAt}
                                                >
                                                    {formatAdminDate(
                                                        server.createdAt
                                                    )}
                                                </time>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminBadge
                                                    tone={status.tone}
                                                    withDot
                                                >
                                                    {status.label}
                                                </AdminBadge>
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'pr-5'
                                                )}
                                            >
                                                <div className="flex justify-center">
                                                    <AdminRowMenu
                                                        items={getMenuItems(
                                                            server
                                                        )}
                                                        label={`Thao tác với server ${server.name}`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <AdminPagination
                    end={pageSlice.end}
                    itemLabel="server"
                    onPageChange={setCurrentPage}
                    page={pageSlice.page}
                    start={pageSlice.start}
                    totalItems={filteredServers.length}
                    totalPages={pageSlice.totalPages}
                />
            </section>

            <ConfirmDialog
                confirmLabel="Xóa server"
                description={
                    serverToDelete
                        ? `Server "${serverToDelete.name}" và toàn bộ thành viên sẽ bị gỡ khỏi UIT Connect. Thao tác này không thể hoàn tác.`
                        : ''
                }
                isOpen={serverToDelete !== null}
                onClose={() => setServerToDelete(null)}
                onConfirm={() => {
                    if (serverToDelete) deleteServer(serverToDelete);
                    setServerToDelete(null);
                }}
                title="Xóa server?"
                tone="danger"
            />
        </>
    );
}
