import { Download, FileText, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { SuggestedDocument } from '../dashboard.type';
import { formatCount, SectionCard } from './shared';

export function SuggestedDocumentsCard({ documents }: { documents: SuggestedDocument[] }) {
    return (
        <SectionCard title="Gợi ý tài liệu" viewAllTo="/documents">
            <ul className="divide-y divide-line-subtle">
                {documents.map(({ id, title, author, tags, downloads, likes, thumbnailUrl }) => (
                    <li key={id} className="py-3 first:pt-1 last:pb-0">
                        <Link
                            to={`/documents/${id}`}
                            className="flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        >
                            {thumbnailUrl ? (
                                <img src={thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-line-subtle object-cover" />
                            ) : (
                                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-line-subtle bg-surface-subtle text-muted">
                                    <FileText aria-hidden="true" className="size-6" />
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-heading">{title}</p>
                                <p className="mt-0.5 text-xs text-foreground-secondary">{author}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-foreground-secondary">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 text-sm text-foreground-secondary">
                                <span className="inline-flex items-center gap-1" title="Lượt tải">
                                    <Download aria-hidden="true" className="size-4" />
                                    {formatCount(downloads)}
                                </span>
                                <span className="inline-flex items-center gap-1" title="Lượt thích">
                                    <Heart aria-hidden="true" className="size-4 text-red-500" />
                                    {formatCount(likes)}
                                </span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}