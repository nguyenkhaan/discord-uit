import { Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ForumTopicTagsProps {
    topics: string[] | undefined;
    /** Bấm chủ đề để lọc danh sách */
    isLinkable?: boolean;
}

/** Các chủ đề của bài */
export function ForumTopicTags({
    topics,
    isLinkable = false,
}: ForumTopicTagsProps) {
    if (!topics || topics.length === 0) return null;

    return (
        <ul aria-label="Chủ đề" className="flex flex-wrap gap-1.5">
            {topics.map((topic) => {
                const content = (
                    <>
                        <Hash aria-hidden="true" className="size-3" />
                        {topic}
                    </>
                );
                const className =
                    'inline-flex items-center gap-0.5 rounded-full bg-brand-subtle px-2 py-0.5 text-caption font-medium text-brand';
                return (
                    <li key={topic}>
                        {isLinkable ? (
                            <Link
                                className={`${className} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
                                to={`/forum?topic=${encodeURIComponent(topic)}`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <span className={className}>{content}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
