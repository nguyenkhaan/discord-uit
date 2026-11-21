import { ArrowRight, FolderOpen, Hash, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Input } from '@/components/common/Input';
import {
    mockTaxonomyCollections,
    mockTaxonomyTags,
} from '@/features/taxonomy/taxonomy.mock';
import { cn } from '@/lib/utils';

export default function DocumentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const visibleCollections = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return mockTaxonomyCollections.filter((collection) => {
            const matchesTag =
                !activeTag || collection.tagSlugs.includes(activeTag);
            const matchesQuery =
                !query ||
                [
                    collection.name,
                    collection.slug,
                    collection.description,
                    ...collection.keywords,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query);
            return matchesTag && matchesQuery;
        });
    }, [activeTag, searchTerm]);

    return (
        <div className="space-y-8 pb-10">
            <header className="rounded-2xl border border-line-subtle bg-surface p-6 shadow-soft sm:p-8">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-subtle px-3 py-1 text-xs font-semibold text-brand">
                        <Sparkles aria-hidden="true" className="size-3.5" />
                        Thư viện UIT Connect
                    </span>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
                        Khám phá theo chủ đề
                    </h1>
                    <p className="mt-2 text-base leading-7 text-foreground-secondary">
                        Chọn một collection hoặc tag để bắt đầu khám phá các tài
                        liệu được tổ chức theo ngữ cảnh.
                    </p>
                </div>

                <div className="mt-6 max-w-xl">
                    <label className="sr-only" htmlFor="public-taxonomy-search">
                        Tìm collection hoặc tag
                    </label>
                    <Input
                        aria-label="Tìm collection hoặc tag"
                        id="public-taxonomy-search"
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tìm collection, slug hoặc từ khóa..."
                        startIcon={<Search className="size-4" />}
                        type="search"
                        value={searchTerm}
                    />
                </div>
            </header>

            <section aria-labelledby="public-tags-heading">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                            Bộ lọc nhanh
                        </p>
                        <h2
                            className="mt-1 text-xl font-bold text-heading"
                            id="public-tags-heading"
                        >
                            Tags phổ biến
                        </h2>
                    </div>
                    <p className="text-sm text-muted">
                        {visibleCollections.length} collection phù hợp
                    </p>
                </div>
                <div
                    className="mt-4 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Lọc theo tag"
                >
                    <button
                        aria-pressed={activeTag === null}
                        className={cn(
                            'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                            activeTag === null
                                ? 'border-brand bg-brand text-on-brand'
                                : 'border-line bg-surface text-foreground-secondary hover:border-line-brand-hover hover:text-brand'
                        )}
                        onClick={() => setActiveTag(null)}
                        type="button"
                    >
                        Tất cả
                    </button>
                    {mockTaxonomyTags.map((tag) => (
                        <button
                            aria-pressed={activeTag === tag.slug}
                            className={cn(
                                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                                activeTag === tag.slug
                                    ? 'border-brand bg-brand-subtle font-semibold text-brand'
                                    : 'border-line bg-surface text-foreground-secondary hover:border-line-brand-hover hover:text-brand'
                            )}
                            key={tag.id}
                            onClick={() => setActiveTag(tag.slug)}
                            type="button"
                        >
                            <Hash aria-hidden="true" className="size-4" />
                            {tag.name}
                        </button>
                    ))}
                </div>
            </section>

            <section aria-labelledby="collections-heading">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                            Collections
                        </p>
                        <h2
                            className="mt-1 text-2xl font-bold text-heading"
                            id="collections-heading"
                        >
                            Tài liệu theo ngữ cảnh
                        </h2>
                    </div>
                </div>

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
    );
}
