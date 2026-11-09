import {
    ArrowDown,
    ArrowUp,
    Download,
    Lock,
    LockOpen,
    Megaphone,
    ShieldAlert,
    ShieldCheck,
    UserRound,
    UserX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { mockUsers, userStats } from '@/features/admin/admin.mock';
import { useRowSelection } from '@/features/admin/admin.hooks';
import { USER_ROLE_META, USER_STATUS_META } from '@/features/admin/admin.meta';
import type {
    AdminSelectOption,
    AdminUser,
    AdminUserRole,
    AdminUserStatus,
} from '@/features/admin/admin.type';
import {
    downloadCsv,
    formatAdminDate,
    paginate,
    toTimestamp,
} from '@/features/admin/admin.utils';
import {
    AdminBadge,
    AdminStatusText,
} from '@/features/admin/components/AdminBadge';
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

const PAGE_SIZE = 10;
const COLUMN_COUNT = 9;

type RoleFilter = 'ALL' | AdminUserRole;
type StatusFilter = 'ALL' | AdminUserStatus;
type JoinedFilter = 'ALL' | `${number}`;
type SortDirection = 'desc' | 'asc';

const ROLE_OPTIONS: AdminSelectOption<RoleFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(USER_ROLE_META).map(([value, meta]) => ({
        value: value as AdminUserRole,
        label: meta.label,
    })),
];

const STATUS_OPTIONS: AdminSelectOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(USER_STATUS_META).map(([value, meta]) => ({
        value: value as AdminUserStatus,
        label: meta.label,
    })),
];

function getJoinedYear(user: AdminUser): JoinedFilter {
    return `${new Date(user.joinedAt).getFullYear()}`;
}

function matchesSearch(user: AdminUser, query: string): boolean {
    if (!query) return true;
    return [user.fullName, user.studentCode, user.email].some((value) =>
        value.toLowerCase().includes(query)
    );
}

export default function AdminAccountsPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminUser[]>(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('ALL');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [userToBan, setUserToBan] = useState<AdminUser | null>(null);

    const joinedOptions = useMemo<AdminSelectOption<JoinedFilter>[]>(() => {
        const years = [...new Set(mockUsers.map(getJoinedYear))]
            .sort()
            .reverse();
        return [
            { value: 'ALL', label: 'Tất cả' },
            ...years.map((year) => ({ value: year, label: `Năm ${year}` })),
        ];
    }, []);

    function withPageReset<T>(setter: (value: T) => void) {
        return (value: T) => {
            setter(value);
            setCurrentPage(1);
        };
    }

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        const direction = sortDirection === 'desc' ? -1 : 1;

        return users
            .filter(
                (user) =>
                    matchesSearch(user, query) &&
                    (roleFilter === 'ALL' || user.role === roleFilter) &&
                    (statusFilter === 'ALL' || user.status === statusFilter) &&
                    (joinedFilter === 'ALL' ||
                        getJoinedYear(user) === joinedFilter)
            )
            .sort(
                (a, b) =>
                    direction *
                    (toTimestamp(a.joinedAt) - toTimestamp(b.joinedAt))
            );
    }, [
        users,
        searchTerm,
        roleFilter,
        statusFilter,
        joinedFilter,
        sortDirection,
    ]);

    const pageSlice = paginate(filteredUsers, currentPage, PAGE_SIZE);
    const selection = useRowSelection(pageSlice.items.map((user) => user.id));
    const isFiltering =
        searchTerm.trim() !== '' ||
        roleFilter !== 'ALL' ||
        statusFilter !== 'ALL' ||
        joinedFilter !== 'ALL';

    function updateStatus(
        user: AdminUser,
        status: AdminUserStatus,
        message: string
    ) {
        setUsers((previous) =>
            previous.map((item) =>
                item.id === user.id ? { ...item, status } : item
            )
        );
        showToast(message);
    }

    function getMenuItems(user: AdminUser): AdminRowMenuItem[] {
        const items: AdminRowMenuItem[] = [
            {
                key: 'profile',
                label: 'Xem hồ sơ',
                icon: UserRound,
                onSelect: () =>
                    showToast(
                        `Hồ sơ của ${user.fullName} đang được phát triển.`
                    ),
            },
            {
                key: 'notify',
                label: 'Gửi thông báo',
                icon: Megaphone,
                onSelect: () => navigate('/admin/notifications'),
            },
        ];

        if (user.status === 'ACTIVE') {
            items.push({
                key: 'warn',
                label: 'Cảnh cáo',
                icon: ShieldAlert,
                tone: 'warning',
                dividerBefore: true,
                onSelect: () =>
                    updateStatus(
                        user,
                        'WARNED',
                        `Đã cảnh cáo ${user.fullName}.`
                    ),
            });
        }
        if (user.status === 'WARNED') {
            items.push({
                key: 'unwarn',
                label: 'Gỡ cảnh cáo',
                icon: ShieldCheck,
                tone: 'success',
                dividerBefore: true,
                onSelect: () =>
                    updateStatus(
                        user,
                        'ACTIVE',
                        `Đã gỡ cảnh cáo cho ${user.fullName}.`
                    ),
            });
        }

        items.push(
            user.status === 'BANNED'
                ? {
                      key: 'unban',
                      label: 'Mở khóa tài khoản',
                      icon: LockOpen,
                      tone: 'success',
                      dividerBefore: true,
                      onSelect: () =>
                          updateStatus(
                              user,
                              'ACTIVE',
                              `Đã mở khóa tài khoản ${user.fullName}.`
                          ),
                  }
                : {
                      key: 'ban',
                      label: 'Khóa tài khoản',
                      icon: Lock,
                      tone: 'danger',
                      onSelect: () => setUserToBan(user),
                  }
        );

        return items;
    }

    function exportUsers() {
        downloadCsv(
            'nguoi-dung.csv',
            [
                'Họ tên',
                'MSSV',
                'Email',
                'Vai trò',
                'Ngày tham gia',
                'Trạng thái',
            ],
            filteredUsers.map((user) => [
                user.fullName,
                user.studentCode,
                user.email,
                USER_ROLE_META[user.role].label,
                formatAdminDate(user.joinedAt),
                USER_STATUS_META[user.status].label,
            ])
        );
    }

    const SortIcon = sortDirection === 'desc' ? ArrowDown : ArrowUp;

    return (
        <>
            <AdminPageHeader
                description="Quản lý thông tin, trạng thái và quyền hạn của người dùng trên hệ thống UIT Connect."
                title="Quản lý người dùng"
            />

            <AdminStatGrid stats={userStats} />

            <section
                aria-label="Danh sách người dùng"
                className="rounded-xl border border-line-subtle bg-surface shadow-soft"
            >
                <AdminTableToolbar
                    action={
                        <Button
                            className="w-full sm:w-auto"
                            onClick={exportUsers}
                            size="compact"
                            variant="secondary"
                        >
                            <Download aria-hidden="true" className="size-4" />
                            Xuất danh sách
                        </Button>
                    }
                    filters={
                        <>
                            <AdminFilterSelect
                                label="Vai trò"
                                onChange={withPageReset(setRoleFilter)}
                                options={ROLE_OPTIONS}
                                value={roleFilter}
                            />
                            <AdminFilterSelect
                                label="Trạng thái"
                                onChange={withPageReset(setStatusFilter)}
                                options={STATUS_OPTIONS}
                                value={statusFilter}
                            />
                            <AdminFilterSelect
                                label="Thời gian tham gia"
                                onChange={withPageReset(setJoinedFilter)}
                                options={joinedOptions}
                                value={joinedFilter}
                            />
                        </>
                    }
                    onSearchChange={withPageReset(setSearchTerm)}
                    searchLabel="Tìm kiếm người dùng"
                    searchPlaceholder="Tìm kiếm theo tên, MSSV, email..."
                    searchValue={searchTerm}
                />

                <AdminSelectionBar
                    count={selection.selectedIds.size}
                    itemLabel="người dùng"
                    onClear={selection.clear}
                />

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] border-collapse">
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
                                    Người dùng
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    MSSV
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Email
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Vai trò
                                </th>
                                <th
                                    aria-sort={
                                        sortDirection === 'desc'
                                            ? 'descending'
                                            : 'ascending'
                                    }
                                    className={ADMIN_TH_CLASS}
                                    scope="col"
                                >
                                    <button
                                        className="inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                        onClick={() =>
                                            setSortDirection((value) =>
                                                value === 'desc'
                                                    ? 'asc'
                                                    : 'desc'
                                            )
                                        }
                                        type="button"
                                    >
                                        Ngày tham gia
                                        <SortIcon
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                    </button>
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
                                    emptyIcon={UserX}
                                    emptyTitle="Chưa có người dùng nào"
                                    isFiltering={isFiltering}
                                />
                            ) : (
                                pageSlice.items.map((user, index) => {
                                    const role = USER_ROLE_META[user.role];
                                    const status =
                                        USER_STATUS_META[user.status];
                                    const isSelected =
                                        selection.selectedIds.has(user.id);

                                    return (
                                        <tr
                                            className={cn(
                                                'transition-colors hover:bg-surface-subtle/60',
                                                isSelected &&
                                                    'bg-brand-subtle/60'
                                            )}
                                            key={user.id}
                                        >
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'pl-5'
                                                )}
                                            >
                                                <input
                                                    aria-label={`Chọn ${user.fullName}`}
                                                    checked={isSelected}
                                                    className={
                                                        ADMIN_CHECKBOX_CLASS
                                                    }
                                                    onChange={() =>
                                                        selection.toggle(
                                                            user.id
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
                                                <AdminPersonCell
                                                    name={user.fullName}
                                                />
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-sm text-foreground-secondary tabular-nums'
                                                )}
                                            >
                                                {user.studentCode}
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-sm text-foreground-secondary'
                                                )}
                                            >
                                                {user.email}
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminBadge tone={role.tone}>
                                                    {role.label}
                                                </AdminBadge>
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-sm text-foreground-secondary tabular-nums'
                                                )}
                                            >
                                                <time dateTime={user.joinedAt}>
                                                    {formatAdminDate(
                                                        user.joinedAt
                                                    )}
                                                </time>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminStatusText
                                                    tone={status.tone}
                                                >
                                                    {status.label}
                                                </AdminStatusText>
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
                                                            user
                                                        )}
                                                        label={`Thao tác với ${user.fullName}`}
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
                    itemLabel="người dùng"
                    onPageChange={setCurrentPage}
                    page={pageSlice.page}
                    start={pageSlice.start}
                    totalItems={filteredUsers.length}
                    totalPages={pageSlice.totalPages}
                />
            </section>

            <ConfirmDialog
                confirmLabel="Khóa tài khoản"
                description={
                    userToBan
                        ? `${userToBan.fullName} sẽ không thể đăng nhập vào UIT Connect cho đến khi được mở khóa.`
                        : ''
                }
                isOpen={userToBan !== null}
                onClose={() => setUserToBan(null)}
                onConfirm={() => {
                    if (userToBan) {
                        updateStatus(
                            userToBan,
                            'BANNED',
                            `Đã khóa tài khoản ${userToBan.fullName}.`
                        );
                    }
                    setUserToBan(null);
                }}
                title="Khóa tài khoản người dùng?"
                tone="danger"
            />
        </>
    );
}
