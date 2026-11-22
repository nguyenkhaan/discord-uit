import {
    AlertTriangle,
    ArrowRight,
    FolderOpen,
    LoaderCircle,
    RotateCcw,
    Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { DocumentFilter } from '@/features/documents/components/DocumentFilter';
import {
    createEmptyDocumentFilter,
    filterDocumentCollections,
    type DocumentFilterValue,
} from '@/features/documents/document-filter.utils';
import {
    usePublicCollectionsQuery,
    usePublicTagsQuery,
} from '@/features/taxonomy/taxonomy.hooks';

export default function DocumentsPage() {
    const collectionsQuery = usePublicCollectionsQuery();
    const tagsQuery = usePublicTagsQuery();
    const [filters, setFilters] = useState<DocumentFilterValue>(() =>
        createEmptyDocumentFilter()
    );
    const collections = useMemo(
        () => collectionsQuery.data?.items ?? [],
        [collectionsQuery.data?.items]
    );
    const tags = useMemo(
        () => tagsQuery.data?.items ?? [],
        [tagsQuery.data?.items]
    );
    const visibleCollections = useMemo(
        () => filterDocumentCollections(collections, filters),
        [collections, filters]
    );

    if (collectionsQuery.isLoading || tagsQuery.isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <section
                    aria-label="Đang tải thư viện tài liệu"
                    className="rounded-2xl border border-line-subtle bg-surface p-12 text-center shadow-soft"
                >
                    <LoaderCircle
                        aria-hidden="true"
                        className="mx-auto size-8 animate-spin text-brand motion-reduce:animate-none"
                    />
                    <p className="mt-3 text-sm font-medium text-foreground">
                        Đang tải taxonomy public...
                    </p>
                </section>
            </div>
        );
    }

    if (collectionsQuery.isError || tagsQuery.isError) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <section
                    aria-live="assertive"
                    className="p-12 text-center"
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
            <div className="space-y-8 pb-10">
                <header className="rounded-2xl border border-line-subtle bg-surface p-6 shadow-soft sm:p-8">
                    <div className="max-w-2xl">
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
                            Khám phá theo chủ đề
                        </h1>
                        <p className="mt-2 text-base leading-7 text-foreground-secondary">
                            Chọn một collection hoặc tag để bắt đầu khám phá các
                            tài liệu được tổ chức theo ngữ cảnh.
                        </p>
                        <Link
                            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            to="/documents/upload"
                        >
                            <Upload aria-hidden="true" className="size-4" />
                            Gửi tài liệu
                        </Link>
                    </div>
                </header>

                <DocumentFilter
                    collections={collections}
                    onChange={setFilters}
                    tags={tags}
                    value={filters}
                />

                <div className="flex items-end justify-between gap-3">
                    <p className="text-sm text-muted">
                        {visibleCollections.length} collection phù hợp
                    </p>
                </div>

                <section aria-labelledby="collections-heading">
                    {visibleCollections.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-line-brand bg-surface p-10 text-center">
                            <FolderOpen
                                aria-hidden="true"
                                className="mx-auto size-10 text-placeholder"
                            />
                            <h3 className="mt-3 font-semibold text-heading">
                                Không tìm thấy collection
                            </h3>
                            <p className="mt-1 text-sm text-muted">
                                Thử một từ khóa hoặc tag khác.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleCollections.map((collection) => (
                                <article
                                    className="group flex min-h-64 flex-col rounded-2xl border border-line-subtle bg-surface p-5 shadow-soft transition-transform hover:-translate-y-0.5 hover:border-line-brand-hover"
                                    key={collection.id}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
                                            <FolderOpen
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </span>
                                        <span className="text-xs font-medium text-muted tabular-nums">
                                            {collection.documentCount} tài liệu
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-lg font-bold text-heading">
                                        {collection.name}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground-secondary">
                                        {collection.description}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {collection.keywords
                                            .slice(0, 3)
                                            .map((keyword) => (
                                                <span
                                                    className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-muted"
                                                    key={keyword}
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                    </div>
                                    <Link
                                        className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-brand transition-colors hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                        to={`/documents/collections/${collection.slug}`}
                                    >
                                        Xem collection
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4 transition-transform group-hover:translate-x-0.5"
                                        />
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
