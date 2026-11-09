import {
    CircleCheck,
    Download,
    Eye,
    FlagOff,
    RotateCcw,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { mockReports, reportStats } from '@/features/admin/admin.mock';
import { useRowSelection } from '@/features/admin/admin.hooks';
import {
    REPORT_STATUS_META,
    REPORT_TARGET_META,
    VIOLATION_TYPE_META,
} from '@/features/admin/admin.meta';
import type {
    AdminReport,
    AdminSelectOption,
    ReportStatus,
    ViolationType,
} from '@/features/admin/admin.type';
import {
    downloadCsv,
    formatAdminDate,
    formatAdminTime,
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
    adminIconTileVariants,
} from '@/features/admin/components/adminVariants';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
const COLUMN_COUNT = 9;

type ViolationFilter = 'ALL' | ViolationType;
type StatusFilter = 'ALL' | ReportStatus;
type SortOrder = 'NEWEST' | 'OLDEST';

const VIOLATION_OPTIONS: AdminSelectOption<ViolationFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(VIOLATION_TYPE_META).map(([value, meta]) => ({
        value: value as ViolationType,
        label: meta.label,
    })),
];

const STATUS_OPTIONS: AdminSelectOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(REPORT_STATUS_META).map(([value, meta]) => ({
        value: value as ReportStatus,
        label: meta.label,
    })),
];

const SORT_OPTIONS: AdminSelectOption<SortOrder>[] = [
    { value: 'NEWEST', label: 'Mới nhất' },
    { value: 'OLDEST', label: 'Cũ nhất' },
];

function matchesSearch(report: AdminReport, query: string): boolean {
    if (!query) return true;
    return [
        report.title,
        report.description,
        report.reporter.name,
        report.violator.name,
    ].some((value) => value.toLowerCase().includes(query));
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>(mockReports);
    const [searchTerm, setSearchTerm] = useState('');
    const [violationFilter, setViolationFilter] =
        useState<ViolationFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
    const [currentPage, setCurrentPage] = useState(1);
    const [reportToRemove, setReportToRemove] = useState<AdminReport | null>(
        null
    );

    function withPageReset<T>(setter: (value: T) => void) {
        return (value: T) => {
            setter(value);
            setCurrentPage(1);
        };
    }

    const filteredReports = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        const direction = sortOrder === 'NEWEST' ? -1 : 1;

        return reports
            .filter(
                (report) =>
                    matchesSearch(report, query) &&
                    (violationFilter === 'ALL' ||
                        report.violationType === violationFilter) &&
                    (statusFilter === 'ALL' || report.status === statusFilter)
            )
            .sort(
                (a, b) =>
                    direction *
                    (toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
            );
    }, [reports, searchTerm, violationFilter, statusFilter, sortOrder]);

    const pageSlice = paginate(filteredReports, currentPage, PAGE_SIZE);
    const selection = useRowSelection(
        pageSlice.items.map((report) => report.id)
    );
    const isFiltering =
        searchTerm.trim() !== '' ||
        violationFilter !== 'ALL' ||
        statusFilter !== 'ALL';

    function updateStatus(
        report: AdminReport,
        status: ReportStatus,
        message: string
    ) {
        setReports((previous) =>
            previous.map((item) =>
                item.id === report.id ? { ...item, status } : item
            )
        );
        showToast(message);
    }

    function openDetail(report: AdminReport) {
        showToast(
            `Trang chi tiết báo cáo "${report.title}" đang được phát triển.`
        );
    }

    function getMenuItems(report: AdminReport): AdminRowMenuItem[] {
        const detail: AdminRowMenuItem = {
            key: 'view',
            label: 'Xem chi tiết',
            icon: Eye,
            onSelect: () => openDetail(report),
        };

        if (report.status !== 'PENDING') {
            return [
                detail,
                {
                    key: 'reopen',
                    label: 'Mở lại báo cáo',
                    icon: RotateCcw,
                    tone: 'warning',
                    dividerBefore: true,
                    onSelect: () =>
                        updateStatus(report, 'PENDING', 'Đã mở lại báo cáo.'),
                },
            ];
        }

        return [
            detail,
            {
                key: 'resolve',
                label: 'Đánh dấu đã xử lý',
                icon: CircleCheck,
                tone: 'success',
                dividerBefore: true,
                onSelect: () =>
                    updateStatus(
                        report,
                        'RESOLVED',
                        'Đã đánh dấu báo cáo là đã xử lý.'
                    ),
            },
            {
                key: 'dismiss',
                label: 'Bỏ qua báo cáo',
                icon: XCircle,
                onSelect: () =>
                    updateStatus(report, 'DISMISSED', 'Đã bỏ qua báo cáo.'),
            },
            {
                key: 'remove',
                label: 'Gỡ nội dung',
                icon: Trash2,
                tone: 'danger',
                dividerBefore: true,
                onSelect: () => setReportToRemove(report),
            },
        ];
    }

    function exportReports() {
        downloadCsv(
            'bao-cao-vi-pham.csv',
            [
                'Mã',
                'Loại nội dung',
                'Nội dung',
                'Mô tả',
                'Loại vi phạm',
                'Người báo cáo',
                'Người vi phạm',
                'Thời gian',
                'Trạng thái',
            ],
            filteredReports.map((report) => [
                report.id,
                REPORT_TARGET_META[report.targetType].label,
                report.title,
                report.description,
                VIOLATION_TYPE_META[report.violationType].label,
                report.reporter.name,
                report.violator.name,
                `${formatAdminDate(report.createdAt)} ${formatAdminTime(report.createdAt)}`,
                REPORT_STATUS_META[report.status].label,
            ])
        );
    }

    return (
        <>
            <AdminPageHeader
                description="Quản lý và xử lý các báo cáo vi phạm từ người dùng trên UIT Connect."
                title="Báo cáo vi phạm"
            />

            <AdminStatGrid stats={reportStats} />

            <section
                aria-label="Danh sách báo cáo vi phạm"
                className="rounded-xl border border-line-subtle bg-surface shadow-soft"
            >
                <AdminTableToolbar
                    action={
                        <Button
                            className="w-full sm:w-auto"
                            onClick={exportReports}
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
                                label="Loại vi phạm"
                                onChange={withPageReset(setViolationFilter)}
                                options={VIOLATION_OPTIONS}
                                value={violationFilter}
                            />
                            <AdminFilterSelect
                                label="Trạng thái"
                                onChange={withPageReset(setStatusFilter)}
                                options={STATUS_OPTIONS}
                                value={statusFilter}
                            />
                            <AdminFilterSelect
                                label="Thời gian"
                                onChange={withPageReset(setSortOrder)}
                                options={SORT_OPTIONS}
                                value={sortOrder}
                            />
                        </>
                    }
                    onSearchChange={withPageReset(setSearchTerm)}
                    searchLabel="Tìm kiếm báo cáo"
                    searchPlaceholder="Tìm kiếm báo cáo, tiêu đề, người dùng..."
                    searchValue={searchTerm}
                />

                <AdminSelectionBar
                    count={selection.selectedIds.size}
                    itemLabel="báo cáo"
                    onClear={selection.clear}
                />

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse">
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
                                    Nội dung bị báo cáo
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Loại vi phạm
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Người báo cáo
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Người vi phạm
                                </th>
                                <th className={ADMIN_TH_CLASS} scope="col">
                                    Thời gian
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
                                    emptyIcon={FlagOff}
                                    emptyTitle="Chưa có báo cáo vi phạm nào"
                                    isFiltering={isFiltering}
                                />
                            ) : (
                                pageSlice.items.map((report, index) => {
                                    const target =
                                        REPORT_TARGET_META[report.targetType];
                                    const violation =
                                        VIOLATION_TYPE_META[
                                            report.violationType
                                        ];
                                    const status =
                                        REPORT_STATUS_META[report.status];
                                    const TargetIcon = target.icon;
                                    const isSelected =
                                        selection.selectedIds.has(report.id);

                                    return (
                                        <tr
                                            className={cn(
                                                'transition-colors hover:bg-surface-subtle/60',
                                                isSelected &&
                                                    'bg-brand-subtle/60'
                                            )}
                                            key={report.id}
                                        >
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'pl-5'
                                                )}
                                            >
                                                <input
                                                    aria-label={`Chọn báo cáo ${report.title}`}
                                                    checked={isSelected}
                                                    className={
                                                        ADMIN_CHECKBOX_CLASS
                                                    }
                                                    onChange={() =>
                                                        selection.toggle(
                                                            report.id
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
                                                    <span
                                                        className={adminIconTileVariants(
                                                            {
                                                                tone: target.tone,
                                                                shape: 'square',
                                                            }
                                                        )}
                                                    >
                                                        <TargetIcon
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-foreground">
                                                            {target.label}:{' '}
                                                            {report.title}
                                                        </p>
                                                        <p className="truncate text-xs text-muted">
                                                            {report.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminBadge
                                                    tone={violation.tone}
                                                >
                                                    {violation.label}
                                                </AdminBadge>
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminPersonCell
                                                    name={report.reporter.name}
                                                    subtitle={
                                                        report.reporter
                                                            .roleLabel
                                                    }
                                                />
                                            </td>
                                            <td className={ADMIN_TD_CLASS}>
                                                <AdminPersonCell
                                                    name={report.violator.name}
                                                    subtitle={
                                                        report.violator
                                                            .roleLabel
                                                    }
                                                />
                                            </td>
                                            <td
                                                className={cn(
                                                    ADMIN_TD_CLASS,
                                                    'text-sm whitespace-nowrap text-foreground-secondary tabular-nums'
                                                )}
                                            >
                                                <time
                                                    dateTime={report.createdAt}
                                                >
                                                    {formatAdminDate(
                                                        report.createdAt
                                                    )}
                                                    <span className="block text-xs text-muted">
                                                        {formatAdminTime(
                                                            report.createdAt
                                                        )}
                                                    </span>
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
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        aria-label={`Xem chi tiết báo cáo ${report.title}`}
                                                        className="size-9 min-h-9"
                                                        onClick={() =>
                                                            openDetail(report)
                                                        }
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <Eye
                                                            aria-hidden="true"
                                                            className="size-4.5"
                                                        />
                                                    </Button>
                                                    <AdminRowMenu
                                                        items={getMenuItems(
                                                            report
                                                        )}
                                                        label={`Thao tác với báo cáo ${report.title}`}
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
                    itemLabel="báo cáo"
                    onPageChange={setCurrentPage}
                    page={pageSlice.page}
                    start={pageSlice.start}
                    totalItems={filteredReports.length}
                    totalPages={pageSlice.totalPages}
                />
            </section>

            <ConfirmDialog
                confirmLabel="Gỡ nội dung"
                description={
                    reportToRemove
                        ? `Nội dung "${reportToRemove.title}" sẽ bị gỡ khỏi UIT Connect và báo cáo được đánh dấu đã xử lý.`
                        : ''
                }
                isOpen={reportToRemove !== null}
                onClose={() => setReportToRemove(null)}
                onConfirm={() => {
                    if (reportToRemove) {
                        updateStatus(
                            reportToRemove,
                            'RESOLVED',
                            `Đã gỡ nội dung "${reportToRemove.title}".`
                        );
                    }
                    setReportToRemove(null);
                }}
                title="Gỡ nội dung vi phạm?"
                tone="danger"
            />
        </>
    );
}
