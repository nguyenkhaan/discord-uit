import { X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';

import {
    MAX_FORUM_TOPIC_LENGTH,
    MAX_FORUM_TOPICS,
    normalizeForumTopic,
} from '@/features/forum/forum.utils';

interface ForumTopicInputProps {
    label: string;
    hint?: string;
    topics: string[];
    onChange: (topics: string[]) => void;
    disabled?: boolean;
}

/** Nhập chủ đề tự do: Enter hoặc dấu phẩy để thêm, Backspace để xoá chủ đề cuối */
export function ForumTopicInput({
    label,
    hint,
    topics,
    onChange,
    disabled,
}: ForumTopicInputProps) {
    const inputId = useId();
    const hintId = useId();
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string>();
    const isFull = topics.length >= MAX_FORUM_TOPICS;

    function addTopic() {
        if (!draft.trim()) return;
        const topic = normalizeForumTopic(draft);
        if (!topic) {
            setError(
                `Chủ đề tối đa ${MAX_FORUM_TOPIC_LENGTH} ký tự, chỉ gồm chữ, số, khoảng trắng và - _ . + #`
            );
            return;
        }
        if (isFull) {
            setError(`Tối đa ${MAX_FORUM_TOPICS} chủ đề.`);
            return;
        }
        setError(undefined);
        setDraft('');
        if (!topics.includes(topic)) onChange([...topics, topic]);
    }

    function removeTopic(topic: string) {
        setError(undefined);
        onChange(topics.filter((item) => item !== topic));
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTopic();
        } else if (event.key === 'Backspace' && !draft && topics.length > 0) {
            removeTopic(topics[topics.length - 1]);
        }
    }

    return (
        <div>
            <label
                className="mb-1.5 block text-sm font-semibold text-heading"
                htmlFor={inputId}
            >
                {label}
            </label>
            <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 focus-within:border-brand focus-within:ring-3 focus-within:ring-focus/20">
                {topics.map((topic) => (
                    <span
                        className="inline-flex items-center gap-1 rounded-full bg-brand-subtle py-0.5 pl-2.5 pr-1 text-sm text-brand"
                        key={topic}
                    >
                        {topic}
                        <button
                            aria-label={`Bỏ chủ đề ${topic}`}
                            className="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            disabled={disabled}
                            onClick={() => removeTopic(topic)}
                            type="button"
                        >
                            <X aria-hidden="true" className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    aria-describedby={hintId}
                    className="min-w-32 flex-1 bg-transparent px-1 py-1 text-body outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
                    disabled={disabled || isFull}
                    id={inputId}
                    onBlur={addTopic}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isFull ? 'Đã đủ chủ đề' : 'Nhập chủ đề rồi nhấn Enter'
                    }
                    value={draft}
                />
            </div>
            <p
                className={
                    error
                        ? 'mt-1 text-caption text-feedback-danger'
                        : 'mt-1 text-caption text-muted'
                }
                id={hintId}
                role={error ? 'alert' : undefined}
            >
                {error ?? hint ?? `${topics.length}/${MAX_FORUM_TOPICS} chủ đề`}
            </p>
        </div>
    );
}
