import { ArrowLeft, FolderOpen, Hash, Library } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import {
    mockTaxonomyCollections,
    mockTaxonomyTags,
} from '@/features/taxonomy/taxonomy.mock';

export default function CollectionDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const collection = mockTaxonomyCollections.find(
        (item) => item.slug === slug
    );

    if (!collection) {
        return (
            <div className="rounded-2xl border border-dashed border-line-brand bg-surface p-12 text-center">
                <FolderOpen
                    aria-hidden="true"
                    className="mx-auto size-10 text-placeholder"
                />
                <h1 className="mt-4 text-2xl font-bold text-heading">
                    Không tìm thấy collection
                </h1>
                <p className="mt-2 text-sm text-foreground-secondary">
                    Collection này có thể đã được đổi slug hoặc chưa được công
                    bố.
                </p>
                <Link
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-brand bg-surface px-3 text-sm font-bold text-brand transition-colors hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    to="/documents"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Quay lại thư viện
                </Link>
            </div>
        );
    }

    const tags = mockTaxonomyTags.filter((tag) =>
        collection.tagSlugs.includes(tag.slug)
    );

    return (
        <div className="space-y-6 pb-10">
            <Link
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                to="/documents"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Quay lại thư viện
            </Link>

            <header className="rounded-2xl border border-line-subtle bg-surface p-6 shadow-soft sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-subtle text-brand">
                        <FolderOpen aria-hidden="true" className="size-7" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                            Collection
                        </p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-heading">
                            {collection.name}
                        </h1>
                        <code className="mt-3 inline-block rounded-md bg-surface-subtle px-2.5 py-1 text-xs text-brand">
                            {collection.slug}
                        </code>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-foreground-secondary">
                            {collection.description}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                    {collection.keywords.map((keyword) => (
                        <span
                            className="rounded-full bg-surface-subtle px-3 py-1.5 text-sm text-foreground-secondary"
                            key={keyword}
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            </header>

            <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-line-subtle bg-surface p-6 shadow-soft">
                    <div className="flex items-start gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-brand-subtle text-brand">
                            <Library aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <h2 className="font-bold text-heading">
                                Tài liệu trong collection
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                {collection.documentCount} tài liệu đã được phân
                                loại.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 rounded-xl border border-dashed border-line-brand bg-page p-6 text-center">
                        <p className="text-sm font-medium text-foreground">
                            Danh sách tài liệu sẽ được kết nối ở Task 5.5.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                            Trang này hiện chỉ hiển thị taxonomy public và
                            metadata của collection.
                        </p>
                    </div>
                </div>

                <aside className="rounded-2xl border border-line-subtle bg-surface p-6 shadow-soft">
                    <h2 className="font-bold text-heading">Tags liên quan</h2>
                    <div className="mt-4 space-y-2">
                        {tags.map((tag) => (
                            <div
                                className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2.5"
                                key={tag.id}
                            >
                                <Hash
                                    aria-hidden="true"
                                    className="size-4 text-brand"
                                />
                                <span className="text-sm text-foreground-secondary">
                                    {tag.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>
            </section>
        </div>
    );
}
