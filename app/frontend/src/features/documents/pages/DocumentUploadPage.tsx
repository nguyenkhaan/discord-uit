import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    FileUp,
    LoaderCircle,
    RotateCcw,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import {
    useMySubmissionsQuery,
    useUploadDocumentMutation,
} from '@/features/documents/document.hooks';
import { validateDocumentFile } from '@/features/documents/document.service';
import type { DocumentSubmission } from '@/features/documents/document.type';
import { usePublicTagsQuery } from '@/features/taxonomy/taxonomy.hooks';

function formatBytes(value: number): string {
    if (value < 1024) return `${value} B`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: DocumentSubmission['submissionStatus']): string {
    if (status === 'PENDING_PROCESSING') return 'Đang hoàn tất upload';
    if (status === 'PENDING_REVIEW') return 'Chờ admin duyệt';
    if (status === 'APPROVED') return 'Đã duyệt và public';
    return 'Đã bị từ chối';
}

function statusClass(status: DocumentSubmission['submissionStatus']): string {
    if (status === 'APPROVED') return 'bg-success-subtle text-feedback-success';
    if (status === 'REJECTED') return 'bg-danger-subtle text-feedback-danger';
    return 'bg-warning-subtle text-feedback-warning';
}

function SubmissionRow({ submission }: { submission: DocumentSubmission }) {
    return (
        <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle py-4 last:border-b-0">
            <div className="min-w-0">
                <p className="truncate font-semibold text-heading">
                    {submission.title}
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                    {submission.fileName} · {formatBytes(submission.sizeBytes)}
                </p>
                {submission.rejectionReason && (
                    <p className="mt-1 text-sm text-feedback-danger">
                        Lý do: {submission.rejectionReason}
                    </p>
                )}
            </div>
            <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(submission.submissionStatus)}`}
            >
                {statusLabel(submission.submissionStatus)}
            </span>
        </li>
    );
}

export default function DocumentUploadPage() {
    const tagsQuery = usePublicTagsQuery();
    const submissionsQuery = useMySubmissionsQuery();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const uploadMutation = useUploadDocumentMutation((value) =>
        setProgress(value.percentage)
    );

    function handleFileChange(nextFile: File | undefined) {
        setError('');
        setCompleted(false);
        if (!nextFile) {
            setFile(null);
            return;
        }
        const fileError = validateDocumentFile(nextFile);
        if (fileError) {
            setFile(null);
            setError(fileError);
            return;
        }
        setFile(nextFile);
    }

    function toggleTag(slugValue: string) {
        setSelectedTags((current) =>
            current.includes(slugValue)
                ? current.filter((value) => value !== slugValue)
                : [...current, slugValue]
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setCompleted(false);
        if (!file) {
            setError('Vui lòng chọn file tài liệu.');
            return;
        }
        try {
            await uploadMutation.mutateAsync({
                title,
                slug,
                description,
                file,
                tagSlugs: selectedTags,
            });
            setCompleted(true);
            setProgress(100);
            setTitle('');
            setSlug('');
            setDescription('');
            setFile(null);
            setSelectedTags([]);
        } catch (uploadError) {
            setError(
                uploadError instanceof Error
                    ? uploadError.message
                    : 'Không thể gửi tài liệu.'
            );
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-8 pb-10">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            className="text-sm font-semibold text-brand hover:text-brand-active"
                            to="/documents"
                        >
                            ← Quay lại thư viện
                        </Link>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-heading">
                            Gửi tài liệu
                        </h1>
                        <p className="mt-2 text-foreground-secondary">
                            File sẽ được giữ riêng tư để admin xem trước và
                            duyệt.
                        </p>
                    </div>
                </header>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                    <form
                        className="rounded-2xl bg-surface p-6 shadow-soft sm:p-8"
                        onSubmit={(event) => void handleSubmit(event)}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="mb-2 block text-sm font-semibold text-heading">
                                    Tiêu đề
                                </span>
                                <Input
                                    maxLength={200}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="Ví dụ: Nhập môn học máy"
                                    required
                                    value={title}
                                />
                            </label>
                            <label className="sm:col-span-2">
                                <span className="mb-2 block text-sm font-semibold text-heading">
                                    Slug{' '}
                                    <span className="font-normal text-muted">
                                        (tùy chọn)
                                    </span>
                                </span>
                                <Input
                                    maxLength={255}
                                    onChange={(event) =>
                                        setSlug(event.target.value)
                                    }
                                    placeholder="nhap-mon-hoc-may"
                                    value={slug}
                                />
                            </label>
                            <label className="sm:col-span-2">
                                <span className="mb-2 block text-sm font-semibold text-heading">
                                    Mô tả{' '}
                                    <span className="font-normal text-muted">
                                        (tùy chọn)
                                    </span>
                                </span>
                                <textarea
                                    className="min-h-28 w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-3 focus:ring-focus/20"
                                    maxLength={2000}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="Mô tả ngắn nội dung tài liệu"
                                    value={description}
                                />
                            </label>
                            <div className="sm:col-span-2">
                                <span className="mb-2 block text-sm font-semibold text-heading">
                                    Tags
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {(tagsQuery.data?.items ?? []).map(
                                        (tag) => {
                                            const selected =
                                                selectedTags.includes(tag.slug);
                                            return (
                                                <button
                                                    aria-pressed={selected}
                                                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${selected ? 'border-brand bg-brand-subtle font-semibold text-brand' : 'border-line text-foreground-secondary hover:border-line-brand-hover'}`}
                                                    key={tag.id}
                                                    onClick={() =>
                                                        toggleTag(tag.slug)
                                                    }
                                                    type="button"
                                                >
                                                    {tag.name}
                                                </button>
                                            );
                                        }
                                    )}
                                    {!tagsQuery.isLoading &&
                                        (tagsQuery.data?.items.length ?? 0) ===
                                            0 && (
                                            <span className="text-sm text-muted">
                                                Chưa có tag.
                                            </span>
                                        )}
                                </div>
                            </div>
                            <label className="sm:col-span-2">
                                <span className="mb-2 block text-sm font-semibold text-heading">
                                    File tài liệu
                                </span>
                                <input
                                    accept=".pdf,.docx,.pptx,.txt"
                                    className="block w-full cursor-pointer rounded-lg border border-line bg-surface-subtle p-3 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:font-semibold file:text-on-brand"
                                    onChange={(event) =>
                                        handleFileChange(
                                            event.target.files?.[0]
                                        )
                                    }
                                    type="file"
                                />
                                <p className="mt-2 text-xs text-muted">
                                    PDF, DOCX, PPTX hoặc TXT · tối đa 5 MB.
                                </p>
                            </label>
                        </div>

                        {file && (
                            <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface-subtle p-3 text-sm">
                                <FileUp
                                    aria-hidden="true"
                                    className="size-5 text-brand"
                                />
                                <span className="truncate text-foreground">
                                    {file.name}
                                </span>
                                <span className="ml-auto shrink-0 text-muted">
                                    {formatBytes(file.size)}
                                </span>
                            </div>
                        )}

                        {uploadMutation.isPending && (
                            <div aria-live="polite" className="mt-5">
                                <div className="mb-2 flex justify-between text-sm text-muted">
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
                                    <div
                                        className="h-full rounded-full bg-brand transition-[width]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {(error || uploadMutation.isError) && (
                            <div
                                className="mt-5 flex gap-2 p-3 text-sm text-feedback-danger"
                                role="alert"
                            >
                                <AlertTriangle
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                <span>
                                    {error ||
                                        'Upload thất bại. Vui lòng thử lại.'}
                                </span>
                            </div>
                        )}
                        {completed && (
                            <div
                                className="mt-5 flex gap-2 rounded-xl border border-success-border bg-success-subtle p-3 text-sm text-feedback-success"
                                role="status"
                            >
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                Tài liệu đã upload và đang chờ admin duyệt.
                            </div>
                        )}

                        <Button
                            className="mt-6"
                            disabled={uploadMutation.isPending}
                            type="submit"
                        >
                            {uploadMutation.isPending ? (
                                <LoaderCircle
                                    aria-hidden="true"
                                    className="size-4 animate-spin motion-reduce:animate-none"
                                />
                            ) : (
                                <FileUp aria-hidden="true" className="size-4" />
                            )}
                            Gửi tài liệu
                        </Button>
                    </form>

                    <section
                        className="rounded-2xl bg-surface p-6 shadow-soft sm:p-8"
                        aria-labelledby="my-submissions-heading"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                                    Theo dõi
                                </p>
                                <h2
                                    className="mt-1 text-xl font-bold text-heading"
                                    id="my-submissions-heading"
                                >
                                    Tài liệu đã gửi
                                </h2>
                            </div>
                            <Clock3
                                aria-hidden="true"
                                className="size-5 text-brand"
                            />
                        </div>
                        {submissionsQuery.isLoading ? (
                            <div className="mt-5 space-y-4">
                                {[0, 1, 2].map((item) => (
                                    <Skeleton
                                        className="h-16 w-full"
                                        key={item}
                                    />
                                ))}
                            </div>
                        ) : submissionsQuery.isError ? (
                            <div className="mt-5 text-sm text-feedback-danger">
                                <p>Không tải được danh sách tài liệu đã gửi.</p>
                                <Button
                                    className="mt-3"
                                    onClick={() =>
                                        void submissionsQuery.refetch()
                                    }
                                    size="compact"
                                    variant="secondary"
                                >
                                    <RotateCcw
                                        aria-hidden="true"
                                        className="size-4"
                                    />{' '}
                                    Thử lại
                                </Button>
                            </div>
                        ) : submissionsQuery.data?.length ? (
                            <ul className="mt-3">
                                {submissionsQuery.data.map((submission) => (
                                    <SubmissionRow
                                        key={submission.submissionId}
                                        submission={submission}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-5 text-sm text-muted">
                                Bạn chưa gửi tài liệu nào.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
