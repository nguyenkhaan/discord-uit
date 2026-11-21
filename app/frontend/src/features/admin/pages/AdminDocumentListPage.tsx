import {
    ArrowLeft,
    FileText,
    LoaderCircle,
    RotateCcw,
    SearchX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import {
    mockTaxonomyCollections,
    mockTaxonomyTags,
} from '@/features/taxonomy/taxonomy.mock';
import type { AdminTone, AdminSelectOption } from '@/features/admin/admin.type';
import { mockAdminDocuments } from '@/features/documents/admin-document.mock';
import type { AdminDocumentStatus } from '@/features/documents/admin-document.type';
import {
    ALL_DOCUMENT_FILTER,
    filterAdminDocuments,
    formatDocumentStatus,
    type AdminDocumentFilter,
} from '@/features/documents/admin-document.utils';
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

function getStatusTone(status: AdminDocumentStatus): AdminTone {
    if (status === 'PENDING') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'danger';
}

function getInitialFilters(collectionSlug: string | null): AdminDocumentFilter {
    const hasCollection = mockTaxonomyCollections.some(
        (collection) => collection.slug === collectionSlug
    );

    return {
        collectionSlug: hasCollection
            ? (collectionSlug ?? ALL_DOCUMENT_FILTER)
            : ALL_DOCUMENT_FILTER,
        tagSlug: ALL_DOCUMENT_FILTER,
        status: ALL_DOCUMENT_FILTER,
        search: '',
    };
}

export default function AdminDocumentListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AdminDocumentFilter>(() =>
        getInitialFilters(searchParams.get('collection'))
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setIsLoading(false), 260);
        return () => window.clearTimeout(timeoutId);
    }, []);

    const collectionOptions = useMemo(
        () =>
            [
                { value: ALL_DOCUMENT_FILTER, label: 'Tất cả collections' },
                ...mockTaxonomyCollections.map((collection) => ({
                    value: collection.slug,
                    label: collection.name,
                })),
            ] as const,
        []
    );
    const tagOptions = useMemo(
        () =>
            [
                { value: ALL_DOCUMENT_FILTER, label: 'Tất cả tags' },
                ...mockTaxonomyTags.map((tag) => ({
                    value: tag.slug,
                    label: tag.name,
                })),
            ] as const,
        []
    );

    const filteredDocuments = useMemo(
        () => filterAdminDocuments(mockAdminDocuments, filters),
        [filters]
    );
    const pageSlice = paginate(filteredDocuments, currentPage, PAGE_SIZE);
    const isFiltering =
        filters.search.trim() !== '' ||
        filters.collectionSlug !== ALL_DOCUMENT_FILTER ||
        filters.tagSlug !== ALL_DOCUMENT_FILTER ||
        filters.status !== ALL_DOCUMENT_FILTER;
    const collectionBySlug = useMemo(
        () => new Map(mockTaxonomyCollections.map((item) => [item.slug, item])),
        []
    );
    const tagBySlug = useMemo(
        () => new Map(mockTaxonomyTags.map((item) => [item.slug, item])),
        []
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

    function retryMockLoad() {
        setHasLoadError(false);
        setIsLoading(true);
        window.setTimeout(() => setIsLoading(false), 260);
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

            <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-surface p-4 shadow-soft">
                    <p className="text-sm text-muted">Tổng tài liệu</p>
                    <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                        {mockAdminDocuments.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">Tất cả trạng thái</p>
                </div>
                <div className="rounded-xl bg-surface p-4 shadow-soft">
                    <p className="text-sm text-muted">Chờ duyệt</p>
                    <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                        {
                            mockAdminDocuments.filter(
                                (item) => item.status === 'PENDING'
                            ).length
                        }
                    </p>
                    <p className="mt-1 text-xs text-muted">Cần admin xử lý</p>
                </div>
                <div className="rounded-xl bg-surface p-4 shadow-soft">
                    <p className="text-sm text-muted">Kết quả hiện tại</p>
                    <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                        {filteredDocuments.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        Theo bộ lọc đang chọn
                    </p>
                </div>
            </section>

            {isLoading ? (
                <section
                    aria-label="Đang tải tài liệu"
                    className="rounded-xl border border-line-subtle bg-surface p-10 shadow-soft"
                >
                    <div className="flex flex-col items-center justify-center text-center">
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-8 animate-spin text-brand motion-reduce:animate-none"
                        />
                        <p className="mt-3 text-sm font-medium text-foreground">
                            Đang tải danh sách tài liệu...
                        </p>
                    </div>
                </section>
            ) : hasLoadError ? (
                <section
                    aria-live="assertive"
                    className="rounded-xl border border-danger-border bg-danger-subtle p-10 text-center"
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
                        onClick={retryMockLoad}
                        type="button"
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Thử lại
                    </button>
                </section>
            ) : (
                <section className="overflow-hidden rounded-xl bg-surface shadow-soft">
                    <AdminTableToolbar
                        filters={
                            <>
                                <AdminFilterSelect
                                    label="Collection"
                                    onChange={(value) =>
                                        updateFilter('collectionSlug', value)
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
                                    <th className={ADMIN_TH_CLASS} scope="col">
                                        Tài liệu
                                    </th>
                                    <th className={ADMIN_TH_CLASS} scope="col">
                                        Collection
                                    </th>
                                    <th className={ADMIN_TH_CLASS} scope="col">
                                        Tags
                                    </th>
                                    <th className={ADMIN_TH_CLASS} scope="col">
                                        Người gửi
                                    </th>
                                    <th className={ADMIN_TH_CLASS} scope="col">
                                        Trạng thái
                                    </th>
                                    <th
                                        className={cn(ADMIN_TH_CLASS, 'pr-5')}
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
                                    pageSlice.items.map((document, index) => {
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
                                                    tagBySlug.get(slug)?.name
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
                                                        event.key === 'Enter' ||
                                                        event.key === ' '
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
                                                <td className={ADMIN_TD_CLASS}>
                                                    <Link
                                                        className="group block max-w-80 focus-visible:outline-none"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        to={`/admin/documents/${document.id}`}
                                                    >
                                                        <span className="block truncate text-sm font-semibold text-heading group-hover:text-brand group-focus-visible:text-brand">
                                                            {document.title}
                                                        </span>
                                                        <span className="mt-1 block truncate text-xs text-muted">
                                                            {document.fileName}{' '}
                                                            ·{' '}
                                                            {document.fileSize}
                                                        </span>
                                                    </Link>
                                                </td>
                                                <td className={ADMIN_TD_CLASS}>
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
                                                <td className={ADMIN_TD_CLASS}>
                                                    <div className="flex max-w-52 flex-wrap gap-1.5">
                                                        {tags
                                                            .slice(0, 2)
                                                            .map((tag) => (
                                                                <span
                                                                    className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-foreground-secondary"
                                                                    key={tag}
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        {tags.length > 2 && (
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
                                                        {document.submittedBy}
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
                                                <td className={ADMIN_TD_CLASS}>
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
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        to={`/admin/documents/${document.id}`}
                                                    >
                                                        Xem chi tiết
                                                    </Link>
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
                        itemLabel="tài liệu"
                        onPageChange={setCurrentPage}
                        page={pageSlice.page}
                        start={pageSlice.start}
                        totalItems={filteredDocuments.length}
                        totalPages={pageSlice.totalPages}
                    />
                </section>
            )}
        </div>
    );
}
