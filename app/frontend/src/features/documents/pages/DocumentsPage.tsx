import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Ellipsis,
    FileText,
    FolderOpen,
    RotateCcw,
    Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { SelectBox } from '@/components/common/SelectBox';
import type { SelectOption } from '@/components/common/select.types';
import { Skeleton } from '@/components/common/Skeleton';
import { DocumentFilter } from '@/features/documents/components/DocumentFilter';
import {
    paginateDocumentCollections,
    sortDocumentCollections,
    type DocumentCatalogSort,
} from '@/features/documents/documents-catalog.utils';
import {
    createEmptyDocumentFilter,
    filterDocumentCollections,
    type DocumentFilterValue,
} from '@/features/documents/document-filter.utils';
import {
    usePublicCollectionsQuery,
    usePublicTagsQuery,
} from '@/features/taxonomy/taxonomy.hooks';
import type {
    TaxonomyCollection,
    TaxonomyTag,
} from '@/features/taxonomy/taxonomy.type';

const COLLECTION_PAGE_SIZE = 8;

const sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Mới cập nhật' },
    { value: 'name', label: 'Tên A-Z' },
    { value: 'documents', label: 'Nhiều tài liệu nhất' },
];

const bannerPatterns = [
    'bg-brand-subtle text-brand',
    'bg-warning-subtle text-feedback-warning',
    'bg-violet-subtle text-feedback-violet',
    'bg-success-subtle text-feedback-success',
];

export default function DocumentsPage() {
    const collectionsQuery = usePublicCollectionsQuery();
    const tagsQuery = usePublicTagsQuery();
    const [filters, setFilters] = useState<DocumentFilterValue>(() =>
        createEmptyDocumentFilter()
    );
    const [sort, setSort] = useState<DocumentCatalogSort>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const collections = useMemo(
        () => collectionsQuery.data?.items ?? [],
        [collectionsQuery.data?.items]
    );
    const tags = useMemo(
        () => tagsQuery.data?.items ?? [],
        [tagsQuery.data?.items]
    );
    const filteredCollections = useMemo(
        () => filterDocumentCollections(collections, filters),
        [collections, filters]
    );
    const sortedCollections = useMemo(
        () => sortDocumentCollections(filteredCollections, sort),
        [filteredCollections, sort]
    );
    const collectionPage = useMemo(
        () =>
            paginateDocumentCollections(
                sortedCollections,
                currentPage,
                COLLECTION_PAGE_SIZE
            ),
        [currentPage, sortedCollections]
    );
    const tagBySlug = useMemo(
        () => new Map(tags.map((tag) => [tag.slug, tag])),
        [tags]
    );
    const featuredCollections = sortedCollections.slice(0, 4);
    const categoryCollections = collections.slice(0, 6);
    const isCollectionsLoading = collectionsQuery.isLoading;
    const isTagsLoading = tagsQuery.isLoading;
    const hasError = collectionsQuery.isError || tagsQuery.isError;

    function handleFiltersChange(nextFilters: DocumentFilterValue) {
        setFilters(nextFilters);
        setCurrentPage(1);
    }

    function handleSortChange(nextSort: string | null) {
        if (!nextSort) return;
        setSort(nextSort as DocumentCatalogSort);
        setCurrentPage(1);
    }

    function selectCategory(slug: string | null) {
        handleFiltersChange({
            ...filters,
            collectionSlugs: slug ? [slug] : [],
        });
    }

    if (hasError) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <section
                    aria-live="assertive"
                    className="p-10 text-center"
                    role="alert"
                >
                    <AlertTriangle
                        aria-hidden="true"
                        className="mx-auto size-8 text-feedback-danger"
                    />
                    <h1 className="mt-4 text-xl font-bold text-heading">
                        Không tải được thư viện
                    </h1>
                    <p className="mt-2 text-sm text-foreground-secondary">
                        Vui lòng thử lại sau.
                    </p>
                    <Button
                        className="mt-5"
                        onClick={() => {
                            void Promise.all([
                                collectionsQuery.refetch(),
                                tagsQuery.refetch(),
                            ]);
                        }}
                        size="compact"
                        variant="secondary"
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Thử lại
                    </Button>
                </section>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
                <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
                            Thư viện UIT Connect
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
                            Kho tài liệu
                        </h1>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-foreground-secondary">
                            Khám phá, chia sẻ và học tập cùng cộng đồng sinh
                            viên UIT.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-brand bg-surface px-4 text-sm font-bold text-brand transition-colors hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            to="/documents/upload#my-submissions-heading"
                        >
                            <FileText aria-hidden="true" className="size-4" />
                            Tài liệu của tôi
                        </Link>
                        <Link
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-on-brand shadow-auth-action transition-colors hover:bg-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            to="/documents/upload"
                        >
                            <Upload aria-hidden="true" className="size-4" />
                            Đăng tài liệu
                        </Link>
                    </div>
                </header>

                <nav
                    aria-label="Danh mục collection"
                    className="-mx-1 flex gap-1 overflow-x-auto border-b border-line-subtle px-1"
                >
                    <button
                        aria-current={filters.collectionSlugs.length === 0}
                        className={categoryClass(
                            filters.collectionSlugs.length === 0
                        )}
                        onClick={() => selectCategory(null)}
                        type="button"
                    >
                        Tất cả
                    </button>
                    {categoryCollections.map((collection) => (
                        <button
                            aria-current={
                                filters.collectionSlugs.length === 1 &&
                                filters.collectionSlugs[0] === collection.slug
                            }
                            className={categoryClass(
                                filters.collectionSlugs.length === 1 &&
                                    filters.collectionSlugs[0] ===
                                        collection.slug
                            )}
                            key={collection.id}
                            onClick={() => selectCategory(collection.slug)}
                            type="button"
                        >
                            {collection.name}
                        </button>
                    ))}
                </nav>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <main className="min-w-0 space-y-6">
                        <CatalogBanner />
                        <section aria-labelledby="featured-collections-heading">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                                        Gợi ý cho bạn
                                    </p>
                                    <h2
                                        className="mt-1 text-xl font-bold text-heading"
                                        id="featured-collections-heading"
                                    >
                                        Collection nổi bật
                                    </h2>
                                </div>
                                <button
                                    className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                    onClick={() => selectCategory(null)}
                                    type="button"
                                >
                                    Xem tất cả
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </button>
                            </div>
                            {isCollectionsLoading ? (
                                <FeaturedCollectionsSkeleton />
                            ) : featuredCollections.length > 0 ? (
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {featuredCollections.map(
                                        (collection, index) => (
                                            <FeaturedCollectionCard
                                                collection={collection}
                                                index={index}
                                                key={collection.id}
                                            />
                                        )
                                    )}
                                </div>
                            ) : (
                                <EmptyCollections className="mt-4" />
                            )}
                        </section>

                        <section
                            aria-labelledby="all-collections-heading"
                            className="overflow-hidden rounded-2xl bg-surface shadow-soft"
                        >
                            <div className="flex flex-col gap-4 border-b border-line-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                <div>
                                    <h2
                                        className="text-xl font-bold text-heading"
                                        id="all-collections-heading"
                                    >
                                        Tất cả collection
                                    </h2>
                                    {isCollectionsLoading ? (
                                        <div className="mt-2">
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm text-muted">
                                            {collectionPage.total} collection
                                            phù hợp
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted">
                                        Sắp xếp:
                                    </span>
                                    <SelectBox
                                        aria-label="Sắp xếp collection"
                                        className="w-44"
                                        onChange={handleSortChange}
                                        options={sortOptions}
                                        value={sort}
                                    />
                                </div>
                            </div>
                            {isCollectionsLoading ? (
                                <CollectionTableSkeleton />
                            ) : (
                                <>
                                    <CollectionTable
                                        collections={collectionPage.items}
                                        tagBySlug={tagBySlug}
                                    />
                                    <CatalogPagination
                                        onPageChange={setCurrentPage}
                                        page={collectionPage.page}
                                        pageCount={collectionPage.pageCount}
                                        total={collectionPage.total}
                                    />
                                </>
                            )}
                        </section>
                    </main>

                    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                        <DocumentFilter
                            collections={collections}
                            isCollectionsLoading={isCollectionsLoading}
                            isTagsLoading={isTagsLoading}
                            onChange={handleFiltersChange}
                            tags={tags}
                            value={filters}
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}

function categoryClass(isActive: boolean): string {
    return [
        'min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
        isActive
            ? 'border-brand text-brand'
            : 'border-transparent text-muted hover:border-line-brand-hover hover:text-brand',
    ].join(' ');
}

function CatalogBanner() {
    return (
        <section className="relative isolate overflow-hidden rounded-2xl bg-brand-panel px-6 py-7 text-on-brand shadow-soft sm:px-8 sm:py-8">
            <div
                aria-hidden="true"
                className="absolute -right-16 -top-20 size-64 rounded-full bg-brand-start/30 blur-2xl"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-20 left-1/3 size-52 rounded-full bg-info-accent/25 blur-3xl"
            />
            <div className="relative max-w-xl">
                <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                    Hàng nghìn tài liệu học tập từ sinh viên UIT
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-on-brand/80 sm:text-base">
                    Tìm kiếm theo chủ đề, collection hoặc từ khóa để bắt đầu
                    khám phá ngay hôm nay.
                </p>
            </div>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-5 top-5 hidden h-32 w-64 sm:block"
            >
                <div className="absolute right-1 top-5 grid size-20 -rotate-6 place-items-center rounded-2xl bg-surface p-2 text-brand shadow-card">
                    <FileText className="size-8" />
                    <span className="text-[0.6rem] font-extrabold">PDF</span>
                </div>
                <div className="absolute right-20 top-10 grid size-20 rotate-6 place-items-center rounded-2xl bg-brand-subtle p-2 text-brand shadow-card">
                    <BookOpen className="size-8" />
                    <span className="text-[0.6rem] font-extrabold">DOC</span>
                </div>
                <div className="absolute right-36 top-0 grid size-20 rotate-12 place-items-center rounded-2xl bg-warning-subtle p-2 text-feedback-warning shadow-card">
                    <FolderOpen className="size-8" />
                    <span className="text-[0.6rem] font-extrabold">
                        COLLECTION
                    </span>
                </div>
            </div>
        </section>
    );
}

function FeaturedCollectionCard({
    collection,
    index,
}: {
    collection: TaxonomyCollection;
    index: number;
}) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-soft transition-transform hover:-translate-y-0.5 hover:border-line-brand-hover">
            <div
                className={`relative grid h-28 place-items-center ${bannerPatterns[index % bannerPatterns.length]}`}
            >
                <span className="absolute left-3 top-3 rounded-md bg-surface/80 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide">
                    Collection
                </span>
                <FolderOpen
                    aria-hidden="true"
                    className="size-12 transition-transform group-hover:scale-105"
                />
            </div>
            <div className="p-4">
                <h3 className="truncate font-bold text-heading">
                    {collection.name}
                </h3>
                <p className="mt-1 text-sm text-muted">
                    {collection.documentCount} tài liệu
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {collection.keywords.slice(0, 2).map((keyword) => (
                        <span
                            className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-muted"
                            key={keyword}
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
}

function CollectionTable({
    collections,
    tagBySlug,
}: {
    collections: TaxonomyCollection[];
    tagBySlug: Map<string, TaxonomyTag>;
}) {
    if (collections.length === 0) return <EmptyCollections />;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full text-left text-sm">
                <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
                    <tr>
                        <th className="px-5 py-3 font-semibold" scope="col">
                            Collection
                        </th>
                        <th className="px-5 py-3 font-semibold" scope="col">
                            Mô tả
                        </th>
                        <th className="px-5 py-3 font-semibold" scope="col">
                            Tags
                        </th>
                        <th
                            className="px-5 py-3 text-right font-semibold"
                            scope="col"
                        >
                            Tài liệu
                        </th>
                        <th className="px-5 py-3 font-semibold" scope="col">
                            Cập nhật
                        </th>
                        <th className="px-5 py-3" scope="col">
                            <span className="sr-only">Thao tác</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                    {collections.map((collection) => (
                        <tr
                            className="transition-colors hover:bg-surface-subtle"
                            key={collection.id}
                        >
                            <td className="px-5 py-4">
                                <div className="flex min-w-48 items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">
                                        <FolderOpen
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <Link
                                            className="block truncate font-semibold text-heading hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                            to={`/documents/collections/${collection.slug}`}
                                        >
                                            {collection.name}
                                        </Link>
                                        <code className="mt-1 block truncate text-xs text-muted">
                                            {collection.slug}
                                        </code>
                                    </div>
                                </div>
                            </td>
                            <td className="max-w-xs px-5 py-4 text-foreground-secondary">
                                <span className="line-clamp-2">
                                    {collection.description || 'Chưa có mô tả.'}
                                </span>
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex max-w-44 flex-wrap gap-1.5">
                                    {collection.tagSlugs.length > 0 ? (
                                        collection.tagSlugs
                                            .slice(0, 2)
                                            .map((slug) => (
                                                <span
                                                    className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-muted"
                                                    key={slug}
                                                >
                                                    {tagBySlug.get(slug)
                                                        ?.name ?? slug}
                                                </span>
                                            ))
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold tabular-nums text-heading">
                                {collection.documentCount.toLocaleString(
                                    'vi-VN'
                                )}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-muted">
                                {formatDate(collection.updatedAt)}
                            </td>
                            <td className="px-5 py-4 text-right">
                                <Link
                                    aria-label={`Xem ${collection.name}`}
                                    className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                    to={`/documents/collections/${collection.slug}`}
                                >
                                    <Ellipsis
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CatalogPagination({
    page,
    pageCount,
    total,
    onPageChange,
}: {
    page: number;
    pageCount: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    if (total === 0) return null;

    const start = (page - 1) * COLLECTION_PAGE_SIZE + 1;
    const end = Math.min(page * COLLECTION_PAGE_SIZE, total);

    return (
        <div className="flex flex-col gap-3 border-t border-line-subtle p-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
                Hiển thị {start}–{end} trong {total} collection
            </p>
            <div className="flex items-center gap-1">
                <button
                    aria-label="Trang trước"
                    className="grid size-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-line-brand-hover hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    type="button"
                >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (pageNumber) => (
                        <button
                            aria-current={pageNumber === page}
                            className={[
                                'grid size-9 place-items-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                                pageNumber === page
                                    ? 'bg-brand text-on-brand'
                                    : 'text-muted hover:bg-brand-subtle hover:text-brand',
                            ].join(' ')}
                            key={pageNumber}
                            onClick={() => onPageChange(pageNumber)}
                            type="button"
                        >
                            {pageNumber}
                        </button>
                    )
                )}
                <button
                    aria-label="Trang sau"
                    className="grid size-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-line-brand-hover hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={page === pageCount}
                    onClick={() => onPageChange(page + 1)}
                    type="button"
                >
                    <ChevronRight aria-hidden="true" className="size-4" />
                </button>
            </div>
        </div>
    );
}

function EmptyCollections({ className }: { className?: string }) {
    return (
        <div className={`p-10 text-center ${className ?? ''}`}>
            <FolderOpen
                aria-hidden="true"
                className="mx-auto size-10 text-placeholder"
            />
            <h3 className="mt-3 font-semibold text-heading">
                Không tìm thấy collection
            </h3>
            <p className="mt-1 text-sm text-muted">
                Thử một từ khóa hoặc bộ lọc khác.
            </p>
        </div>
    );
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'Chưa cập nhật';

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

function FeaturedCollectionsSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Đang tải collection nổi bật"
            className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            role="status"
        >
            {[0, 1, 2, 3].map((item) => (
                <Skeleton className="h-56 w-full rounded-2xl" key={item} />
            ))}
        </div>
    );
}

function CollectionTableSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Đang tải danh sách collection"
            className="space-y-3 p-5"
            role="status"
        >
            <div className="grid grid-cols-6 gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                    <Skeleton className="h-3 w-full" key={item} />
                ))}
            </div>
            {[0, 1, 2, 3, 4].map((row) => (
                <div className="grid grid-cols-6 gap-4 py-4" key={row}>
                    {[0, 1, 2, 3, 4, 5].map((column) => (
                        <Skeleton
                            className={[
                                'h-4 w-full',
                                column === 1 && 'w-4/5',
                                column === 2 && 'w-3/5',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            key={column}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
