import { ArrowLeft, FileText, RotateCcw, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminEmptyRow } from '@/features/admin/components/AdminTableStates';
import { AdminFilterSelect } from '@/features/admin/components/AdminFilterSelect';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { AdminTableToolbar } from '@/features/admin/components/AdminTableToolbar';
import {
    ADMIN_TD_CLASS,
    ADMIN_TH_CLASS,
} from '@/features/admin/components/adminVariants';
import { formatAdminDate, paginate } from '@/features/admin/admin.utils';
import type { AdminTone, AdminSelectOption } from '@/features/admin/admin.type';
import {
    useAdminCollectionsQuery,
    useAdminTagsQuery,
} from '@/features/taxonomy/taxonomy.hooks';
import { useAdminSubmissionsQuery } from '@/features/documents/document.hooks';
import type { DocumentSubmission } from '@/features/documents/document.type';
import type { AdminDocumentStatus } from '@/features/documents/admin-document.type';
import {
    ALL_DOCUMENT_FILTER,
    filterAdminDocuments,
    formatDocumentStatus,
    getAdminDocumentStats,
    type AdminDocumentFilter,
} from '@/features/documents/admin-document.utils';
import { Skeleton } from '@/components/common/Skeleton';
import { formatFileSize } from '@/features/documents/document.format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 6;
const COLUMN_COUNT = 7;

const statusOptions: readonly AdminSelectOption<
    AdminDocumentStatus | typeof ALL_DOCUMENT_FILTER
>[] = [
    { value: ALL_DOCUMENT_FILTER, label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' },
];

function toAdminDocument(item: DocumentSubmission) {
    const extension = item.fileName.split('.').pop()?.toUpperCase() ?? 'FILE';
    const fileType = ['DOCX', 'PDF', 'PPTX', 'TXT'].includes(extension)
        ? (extension as 'DOCX' | 'PDF' | 'PPTX' | 'TXT')
        : 'TXT';
    return {
        id: item.submissionId,
        title: item.title,
        slug: item.slug,
        summary: item.description ?? 'Chưa có mô tả.',
        collectionSlugs: item.collectionSlugs,
        tagSlugs: item.tagSlugs,
        status:
            item.submissionStatus === 'APPROVED'
                ? ('APPROVED' as const)
                : item.submissionStatus === 'REJECTED'
                  ? ('REJECTED' as const)
                  : ('PENDING' as const),
        submittedBy: item.submittedBy ?? 'Không xác định',
        submittedAt: item.submittedAt,
        fileName: item.fileName,
        fileType,
        fileSize: formatFileSize(item.sizeBytes),
        pageCount: 0,
        version: 1,
        previewKind: fileType,
        previewHtml: '',
    };
}

function AdminDocumentListSkeleton() {
    return (
        <div
            aria-label="Đang tải danh sách tài liệu"
            className="space-y-6"
            role="status"
        >
            <section className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                    <div
                        className="rounded-xl bg-surface p-4 shadow-soft"
                        key={item}
                    >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-3 h-8 w-16" />
                        <Skeleton className="mt-2 h-3 w-32" />
                    </div>
                ))}
            </section>

            <section className="overflow-hidden rounded-xl bg-surface shadow-soft">
                <div className="flex flex-wrap gap-3 border-b border-line-subtle p-4">
                    <Skeleton className="h-11 min-w-64 flex-1 rounded-lg" />
                    <Skeleton className="h-11 w-40 rounded-lg" />
                    <Skeleton className="h-11 w-40 rounded-lg" />
                    <Skeleton className="h-11 w-40 rounded-lg" />
                </div>
                <div className="space-y-3 p-4">
                    <div className="grid grid-cols-7 gap-4 px-2 py-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((item) => (
                            <Skeleton className="h-3 w-full" key={item} />
                        ))}
                    </div>
                    {[0, 1, 2, 3, 4].map((row) => (
                        <div
                            className="grid grid-cols-7 gap-4 px-2 py-4"
                            key={row}
                        >
                            {[0, 1, 2, 3, 4, 5, 6].map((column) => (
                                <Skeleton
                                    className={cn(
                                        'h-4 w-full',
                                        column === 1 && 'w-4/5',
                                        column === 3 && 'w-3/5'
                                    )}
                                    key={column}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between border-t border-line-subtle p-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
            </section>
        </div>
    );
}

function getStatusTone(status: AdminDocumentStatus): AdminTone {
    if (status === 'PENDING') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'danger';
}

function getInitialFilters(collectionSlug: string | null): AdminDocumentFilter {
    return {
        collectionSlug: collectionSlug ?? ALL_DOCUMENT_FILTER,
        tagSlug: ALL_DOCUMENT_FILTER,
        status: ALL_DOCUMENT_FILTER,
        search: '',
    };
}

export default function AdminDocumentListPage() {
    const documentsQuery = useAdminSubmissionsQuery();
    const collectionsQuery = useAdminCollectionsQuery();
    const tagsQuery = useAdminTagsQuery();
    const collections = useMemo(
        () => collectionsQuery.data?.items ?? [],
        [collectionsQuery.data?.items]
    );
    const tags = useMemo(
        () => tagsQuery.data?.items ?? [],
        [tagsQuery.data?.items]
    );
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AdminDocumentFilter>(() =>
        getInitialFilters(searchParams.get('collection'))
    );
    const [currentPage, setCurrentPage] = useState(1);
    const documents = useMemo(
        () => (documentsQuery.data ?? []).map(toAdminDocument),
        [documentsQuery.data]
    );

    const isLoading =
        documentsQuery.isLoading ||
        collectionsQuery.isLoading ||
        tagsQuery.isLoading;
    const hasLoadError =
        documentsQuery.isError || collectionsQuery.isError || tagsQuery.isError;

    const collectionOptions = useMemo(
        () =>
            [
                { value: ALL_DOCUMENT_FILTER, label: 'Tất cả collections' },
                ...collections.map((collection) => ({
                    value: collection.slug,
                    label: collection.name,
                })),
            ] as const,
        [collections]
    );
    const tagOptions = useMemo(
        () =>
            [
                { value: ALL_DOCUMENT_FILTER, label: 'Tất cả tags' },
                ...tags.map((tag) => ({
                    value: tag.slug,
                    label: tag.name,
                })),
            ] as const,
        [tags]
    );

    const filteredDocuments = useMemo(
        () => filterAdminDocuments(documents, filters),
        [documents, filters]
    );
    const documentStats = useMemo(
        () => getAdminDocumentStats(filteredDocuments),
        [filteredDocuments]
    );
    const pageSlice = paginate(filteredDocuments, currentPage, PAGE_SIZE);
    const isFiltering =
        filters.search.trim() !== '' ||
        filters.collectionSlug !== ALL_DOCUMENT_FILTER ||
        filters.tagSlug !== ALL_DOCUMENT_FILTER ||
        filters.status !== ALL_DOCUMENT_FILTER;
    const collectionBySlug = useMemo(
        () => new Map(collections.map((item) => [item.slug, item])),
        [collections]
    );
    const tagBySlug = useMemo(
        () => new Map(tags.map((item) => [item.slug, item])),
        [tags]
    );

    function updateFilter<Key extends keyof AdminDocumentFilter>(
        key: Key,
        value: AdminDocumentFilter[Key]
    ) {
        setFilters((current) => ({ ...current, [key]: value }));
        setCurrentPage(1);
        if (key === 'collectionSlug') {
            const nextParams = new URLSearchParams(searchParams);
            if (value === ALL_DOCUMENT_FILTER) {
                nextParams.delete('collection');
            } else {
                nextParams.set('collection', String(value));
            }
            setSearchParams(nextParams, { replace: true });
        }
    }

    function retryLoad() {
        void Promise.all([
            documentsQuery.refetch(),
            collectionsQuery.refetch(),
            tagsQuery.refetch(),
        ]);
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    to="/admin/documents"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Quay lại quản lý taxonomy
                </Link>
            </div>

            <AdminPageHeader
                description="Duyệt, lọc và xem trước các tài liệu đang được gửi lên hệ thống."
                title="Danh sách tài liệu"
            />

            {isLoading ? (
                <AdminDocumentListSkeleton />
            ) : hasLoadError ? (
                <section
                    aria-live="assertive"
                    className="p-10 text-center"
                    role="alert"
                >
                    <SearchX
                        aria-hidden="true"
                        className="mx-auto size-8 text-feedback-danger"
                    />
                    <h2 className="mt-3 font-semibold text-heading">
                        Không tải được tài liệu
                    </h2>
                    <p className="mt-1 text-sm text-foreground-secondary">
                        Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
                    </p>
                    <button
                        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line-brand bg-surface px-3 text-sm font-bold text-brand transition-colors hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        onClick={retryLoad}
                        type="button"
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Thử lại
                    </button>
                </section>
            ) : (
                <>
                    <section className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">Tổng tài liệu</p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {documentStats.total}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Theo bộ lọc đang chọn
                            </p>
                        </div>
                        <div className="rounded-xl bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">Chờ duyệt</p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {documentStats.pending}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Trong kết quả hiện tại
                            </p>
                        </div>
                        <div className="rounded-xl bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">
                                Kết quả hiện tại
                            </p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {filteredDocuments.length}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Theo bộ lọc đang chọn
                            </p>
                        </div>
                    </section>

                    <section className="mt-6 overflow-hidden rounded-xl bg-surface shadow-soft">
                        <AdminTableToolbar
                            filters={
                                <>
                                    <AdminFilterSelect
                                        label="Collection"
                                        onChange={(value) =>
                                            updateFilter(
                                                'collectionSlug',
                                                value
                                            )
                                        }
                                        options={collectionOptions}
                                        value={filters.collectionSlug}
                                    />
                                    <AdminFilterSelect
                                        label="Tag"
                                        onChange={(value) =>
                                            updateFilter('tagSlug', value)
                                        }
                                        options={tagOptions}
                                        value={filters.tagSlug}
                                    />
                                    <AdminFilterSelect
                                        label="Trạng thái"
                                        onChange={(value) =>
                                            updateFilter('status', value)
                                        }
                                        options={statusOptions}
                                        value={filters.status}
                                    />
                                </>
                            }
                            onSearchChange={(value) =>
                                updateFilter('search', value)
                            }
                            searchLabel="Tìm kiếm tài liệu"
                            searchPlaceholder="Tìm theo tên, slug hoặc người gửi..."
                            searchValue={filters.search}
                        />

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] border-collapse">
                                <thead className="bg-surface-subtle/60">
                                    <tr>
                                        <th
                                            className={cn(
                                                ADMIN_TH_CLASS,
                                                'w-12 pl-5'
                                            )}
                                            scope="col"
                                        >
                                            #
                                        </th>
                                        <th
                                            className={ADMIN_TH_CLASS}
                                            scope="col"
                                        >
                                            Tài liệu
                                        </th>
                                        <th
                                            className={ADMIN_TH_CLASS}
                                            scope="col"
                                        >
                                            Collection
                                        </th>
                                        <th
                                            className={ADMIN_TH_CLASS}
                                            scope="col"
                                        >
                                            Tags
                                        </th>
                                        <th
                                            className={ADMIN_TH_CLASS}
                                            scope="col"
                                        >
                                            Người gửi
                                        </th>
                                        <th
                                            className={ADMIN_TH_CLASS}
                                            scope="col"
                                        >
                                            Trạng thái
                                        </th>
                                        <th
                                            className={cn(
                                                ADMIN_TH_CLASS,
                                                'pr-5'
                                            )}
                                            scope="col"
                                        >
                                            Cập nhật
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line-subtle">
                                    {pageSlice.items.length === 0 ? (
                                        <AdminEmptyRow
                                            colSpan={COLUMN_COUNT}
                                            emptyIcon={FileText}
                                            emptyTitle="Chưa có tài liệu nào"
                                            isFiltering={isFiltering}
                                        />
                                    ) : (
                                        pageSlice.items.map(
                                            (document, index) => {
                                                const collections =
                                                    document.collectionSlugs
                                                        .map(
                                                            (slug) =>
                                                                collectionBySlug.get(
                                                                    slug
                                                                )?.name
                                                        )
                                                        .filter(Boolean);
                                                const tags = document.tagSlugs
                                                    .map(
                                                        (slug) =>
                                                            tagBySlug.get(slug)
                                                                ?.name
                                                    )
                                                    .filter(Boolean);

                                                return (
                                                    <tr
                                                        aria-label={`Mở tài liệu ${document.title}`}
                                                        className="cursor-pointer transition-colors hover:bg-brand-subtle/40 focus-within:bg-brand-subtle/40"
                                                        key={document.id}
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/documents/${document.id}`
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                    'Enter' ||
                                                                event.key ===
                                                                    ' '
                                                            ) {
                                                                event.preventDefault();
                                                                navigate(
                                                                    `/admin/documents/${document.id}`
                                                                );
                                                            }
                                                        }}
                                                        role="link"
                                                        tabIndex={0}
                                                    >
                                                        <td
                                                            className={cn(
                                                                ADMIN_TD_CLASS,
                                                                'pl-5 text-sm text-muted tabular-nums'
                                                            )}
                                                        >
                                                            {pageSlice.start +
                                                                index +
                                                                1}
                                                        </td>
                                                        <td
                                                            className={
                                                                ADMIN_TD_CLASS
                                                            }
                                                        >
                                                            <Link
                                                                className="group block max-w-80 focus-visible:outline-none"
                                                                onClick={(
                                                                    event
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                                to={`/admin/documents/${document.id}`}
                                                            >
                                                                <span className="block truncate text-sm font-semibold text-heading group-hover:text-brand group-focus-visible:text-brand">
                                                                    {
                                                                        document.title
                                                                    }
                                                                </span>
                                                                <span className="mt-1 block truncate text-xs text-muted">
                                                                    {
                                                                        document.fileName
                                                                    }{' '}
                                                                    ·{' '}
                                                                    {
                                                                        document.fileSize
                                                                    }
                                                                </span>
                                                            </Link>
                                                        </td>
                                                        <td
                                                            className={
                                                                ADMIN_TD_CLASS
                                                            }
                                                        >
                                                            <div className="max-w-56 space-y-1">
                                                                <p className="truncate text-sm text-foreground-secondary">
                                                                    {collections[0] ??
                                                                        'Chưa phân loại'}
                                                                </p>
                                                                {collections.length >
                                                                    1 && (
                                                                    <p className="text-xs text-muted">
                                                                        +
                                                                        {collections.length -
                                                                            1}{' '}
                                                                        collection
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className={
                                                                ADMIN_TD_CLASS
                                                            }
                                                        >
                                                            <div className="flex max-w-52 flex-wrap gap-1.5">
                                                                {tags
                                                                    .slice(0, 2)
                                                                    .map(
                                                                        (
                                                                            tag
                                                                        ) => (
                                                                            <span
                                                                                className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-foreground-secondary"
                                                                                key={
                                                                                    tag
                                                                                }
                                                                            >
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                {tags.length >
                                                                    2 && (
                                                                    <span className="px-1 py-1 text-xs text-muted">
                                                                        +
                                                                        {tags.length -
                                                                            2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className={cn(
                                                                ADMIN_TD_CLASS,
                                                                'text-sm text-foreground-secondary'
                                                            )}
                                                        >
                                                            <p>
                                                                {
                                                                    document.submittedBy
                                                                }
                                                            </p>
                                                            <time
                                                                className="mt-1 block text-xs text-muted"
                                                                dateTime={
                                                                    document.submittedAt
                                                                }
                                                            >
                                                                {formatAdminDate(
                                                                    document.submittedAt
                                                                )}
                                                            </time>
                                                        </td>
                                                        <td
                                                            className={
                                                                ADMIN_TD_CLASS
                                                            }
                                                        >
                                                            <AdminBadge
                                                                tone={getStatusTone(
                                                                    document.status
                                                                )}
                                                                withDot
                                                            >
                                                                {formatDocumentStatus(
                                                                    document.status
                                                                )}
                                                            </AdminBadge>
                                                        </td>
                                                        <td
                                                            className={cn(
                                                                ADMIN_TD_CLASS,
                                                                'pr-5 text-xs text-muted'
                                                            )}
                                                        >
                                                            <Link
                                                                className="inline-flex min-h-9 items-center text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                                                onClick={(
                                                                    event
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                                to={`/admin/documents/${document.id}`}
                                                            >
                                                                Xem chi tiết
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <AdminPagination
                            end={pageSlice.end}
                            itemLabel="tài liệu"
                            onPageChange={setCurrentPage}
                            page={pageSlice.page}
                            start={pageSlice.start}
                            totalItems={filteredDocuments.length}
                            totalPages={pageSlice.totalPages}
                        />
                    </section>
                </>
            )}
        </div>
    );
}
