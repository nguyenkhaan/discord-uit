import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Download,
    FileCode2,
    FileText,
    Hash,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderAsync } from 'docx-preview';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/common/Skeleton';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { formatAdminDate, formatAdminTime } from '@/features/admin/admin.utils';
import type { AdminTone } from '@/features/admin/admin.type';
import {
    useAdminDocumentPreviewQuery,
    useAdminSubmissionsQuery,
    useReviewAdminDocumentMutation,
} from '@/features/documents/document.hooks';
import type {
    DocumentPreview,
    DocumentSubmissionStatus,
} from '@/features/documents/document.type';
import { showToast } from '@/lib/toast';

function statusLabel(status: DocumentSubmissionStatus): string {
    if (status === 'PENDING_REVIEW') return 'Chờ duyệt';
    if (status === 'APPROVED') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Đã từ chối';
    return 'Đang xử lý';
}

function statusTone(status: DocumentSubmissionStatus): AdminTone {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
}

function formatBytes(value: number): string {
    if (value < 1024) return `${value} B`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle py-3 last:border-b-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="max-w-[65%] text-right text-sm font-medium text-foreground">
                {value}
            </dd>
        </div>
    );
}

function TextPreview({ url }: { url: string }) {
    const [content, setContent] = useState('');
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        void fetch(url)
            .then((response) => {
                if (!response.ok) throw new Error('preview failed');
                return response.text();
            })
            .then((value) => {
                if (active) setContent(value);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [url]);
    return error ? (
        <p className="p-6 text-sm text-feedback-danger">
            Không đọc được nội dung TXT.
        </p>
    ) : (
        <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap p-6 text-left text-sm leading-6 text-slate-700">
            {content}
        </pre>
    );
}

function DocumentViewer({ preview }: { preview: DocumentPreview }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const extension = preview.fileName.split('.').pop()?.toLowerCase();
    useEffect(() => {
        if (extension !== 'docx' || !containerRef.current) return;
        const container = containerRef.current;
        container.replaceChildren();
        let active = true;
        void fetch(preview.previewUrl)
            .then((response) => {
                if (!response.ok) throw new Error('preview failed');
                return response.blob();
            })
            .then((blob) => {
                if (active) {
                    return renderAsync(blob, container, undefined, {
                        breakPages: true,
                        inWrapper: true,
                    });
                }
                return undefined;
            })
            .catch(() => {
                if (active) container.textContent = 'Không thể hiển thị DOCX.';
            });
        return () => {
            active = false;
            container.replaceChildren();
        };
    }, [extension, preview.previewUrl]);

    if (extension === 'pdf') {
        return (
            <iframe
                className="h-[34rem] w-full border-0"
                src={preview.previewUrl}
                title={`Xem trước ${preview.fileName}`}
            />
        );
    }
    if (extension === 'docx') {
        return (
            <div
                className="min-h-[34rem] overflow-auto bg-white p-3"
                ref={containerRef}
            />
        );
    }
    if (extension === 'txt') return <TextPreview url={preview.previewUrl} />;
    return (
        <div className="grid min-h-[34rem] place-items-center p-8 text-center">
            <div>
                <FileText
                    aria-hidden="true"
                    className="mx-auto size-12 text-placeholder"
                />
                <p className="mt-4 text-sm text-foreground-secondary">
                    Định dạng này chưa có trình xem trực tiếp.
                </p>
            </div>
        </div>
    );
}

function PreviewPane({ preview }: { preview: DocumentPreview | undefined }) {
    return (
        <section className="overflow-hidden rounded-2xl bg-surface shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-subtle text-brand">
                        <FileCode2 aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-bold text-heading">Xem trước</h2>
                    </div>
                </div>
                {preview && (
                    <a
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line-brand px-3 text-sm font-semibold text-brand hover:bg-brand-subtle"
                        download={preview.fileName}
                        href={preview.downloadUrl}
                        rel="noreferrer"
                        target="_blank"
                    >
                        <Download aria-hidden="true" className="size-4" />
                        Tải file
                    </a>
                )}
            </div>
            <div className="min-h-[34rem] bg-[#f8fafc] p-4 sm:p-6">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-line-subtle bg-white shadow-sm">
                    {preview ? (
                        <DocumentViewer preview={preview} />
                    ) : (
                        <div className="grid min-h-[34rem] place-items-center text-sm text-muted">
                            Đang tải preview...
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function DetailSkeleton() {
    return (
        <div
            className="grid gap-6 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]"
            role="status"
        >
            <div className="space-y-5">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-[38rem] w-full rounded-2xl" />
        </div>
    );
}

function NotFound() {
    return (
        <section className="rounded-2xl border border-dashed border-line-brand bg-surface p-12 text-center">
            <FileText
                aria-hidden="true"
                className="mx-auto size-10 text-placeholder"
            />
            <h1 className="mt-4 text-2xl font-bold text-heading">
                Không tìm thấy tài liệu
            </h1>
            <Link
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand"
                to="/admin/documents/list"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> Quay lại
                danh sách
            </Link>
        </section>
    );
}

export default function AdminDocumentReviewPage() {
    const { documentId } = useParams<{ documentId: string }>();
    const submissionsQuery = useAdminSubmissionsQuery();
    const submission = submissionsQuery.data?.find(
        (item) =>
            item.submissionId === documentId || item.documentId === documentId
    );
    const previewQuery = useAdminDocumentPreviewQuery(submission?.submissionId);
    const reviewMutation = useReviewAdminDocumentMutation();
    const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | ''>('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    if (submissionsQuery.isLoading) return <DetailSkeleton />;
    if (submissionsQuery.isError) {
        return (
            <section className="p-10 text-center" role="alert">
                <AlertTriangle
                    aria-hidden="true"
                    className="mx-auto size-8 text-feedback-danger"
                />
                <p className="mt-3 text-sm text-feedback-danger">
                    Không tải được thông tin tài liệu.
                </p>
                <Button
                    className="mt-4"
                    onClick={() => void submissionsQuery.refetch()}
                    size="compact"
                    variant="secondary"
                >
                    Thử lại
                </Button>
            </section>
        );
    }
    if (!submission) return <NotFound />;

    const isPending = submission.submissionStatus === 'PENDING_REVIEW';
    const canConfirm =
        decision !== '' &&
        (decision !== 'REJECTED' || rejectionReason.trim() !== '');
    const submissionId = submission.submissionId;

    async function confirmReview() {
        if (!decision || !canConfirm) return;
        try {
            await reviewMutation.mutateAsync({
                submissionId,
                decision,
                rejectionReason,
            });
            setIsConfirmOpen(false);
            showToast(
                decision === 'APPROVED'
                    ? 'Tài liệu đã được duyệt và public.'
                    : 'Tài liệu đã bị từ chối và giữ ở chế độ ẩn.'
            );
            setDecision('');
        } catch {
            showToast('Không thể lưu quyết định. Vui lòng thử lại.');
        }
    }

    return (
        <div className="space-y-6 pb-10">
            <Link
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-brand-active"
                to="/admin/documents/list"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> Quay lại
                danh sách tài liệu
            </Link>
            <AdminPageHeader
                action={
                    isPending ? (
                        <div className="w-full space-y-2 sm:w-auto">
                            <div className="flex flex-wrap gap-2">
                                <select
                                    aria-label="Quyết định duyệt tài liệu"
                                    className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-foreground"
                                    onChange={(event) =>
                                        setDecision(
                                            event.target.value as
                                                'APPROVED' | 'REJECTED' | ''
                                        )
                                    }
                                    value={decision}
                                >
                                    <option value="">Chọn quyết định</option>
                                    <option value="APPROVED">
                                        Duyệt và public
                                    </option>
                                    <option value="REJECTED">Từ chối</option>
                                </select>
                                <Button
                                    disabled={!canConfirm}
                                    onClick={() => setIsConfirmOpen(true)}
                                    size="compact"
                                >
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-4"
                                    />{' '}
                                    Lưu quyết định
                                </Button>
                            </div>
                            {decision === 'REJECTED' && (
                                <textarea
                                    aria-label="Lý do từ chối"
                                    className="min-h-20 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                                    onChange={(event) =>
                                        setRejectionReason(event.target.value)
                                    }
                                    placeholder="Nhập lý do từ chối"
                                    value={rejectionReason}
                                />
                            )}
                        </div>
                    ) : undefined
                }
                title="Chi tiết tài liệu"
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
                <aside className="space-y-5">
                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <div className="flex items-start gap-3">
                            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">
                                <FileText
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </span>
                            <div className="min-w-0">
                                <AdminBadge
                                    tone={statusTone(
                                        submission.submissionStatus
                                    )}
                                    withDot
                                >
                                    {statusLabel(submission.submissionStatus)}
                                </AdminBadge>
                                <h2 className="mt-3 text-lg font-bold text-heading">
                                    {submission.title}
                                </h2>
                                <p className="mt-1 break-all text-xs text-muted">
                                    {submission.slug}
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-6 text-foreground-secondary">
                            {submission.description ?? 'Chưa có mô tả.'}
                        </p>
                    </section>
                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <h2 className="font-bold text-heading">Metadata</h2>
                        <dl className="mt-2">
                            <MetadataRow
                                label="Tên file"
                                value={submission.fileName}
                            />
                            <MetadataRow
                                label="Định dạng"
                                value={submission.mimeType}
                            />
                            <MetadataRow
                                label="Kích thước"
                                value={formatBytes(submission.sizeBytes)}
                            />
                            <MetadataRow
                                label="Người gửi"
                                value={
                                    submission.submittedBy ?? 'Không xác định'
                                }
                            />
                            <MetadataRow
                                label="Thời gian gửi"
                                value={`${formatAdminDate(submission.submittedAt)} ${formatAdminTime(submission.submittedAt)}`}
                            />
                        </dl>
                    </section>
                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <h2 className="font-bold text-heading">Taxonomy</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {submission.collectionSlugs.map((slug) => (
                                <span
                                    className="rounded-full bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand"
                                    key={slug}
                                >
                                    {slug}
                                </span>
                            ))}
                            {submission.tagSlugs.map((slug) => (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full bg-violet-subtle px-3 py-1.5 text-xs font-semibold text-feedback-violet"
                                    key={slug}
                                >
                                    <Hash
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    {slug}
                                </span>
                            ))}
                            {submission.collectionSlugs.length === 0 &&
                                submission.tagSlugs.length === 0 && (
                                    <span className="text-sm text-muted">
                                        Chưa phân loại.
                                    </span>
                                )}
                        </div>
                    </section>
                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <div className="flex items-start gap-3">
                            <Clock3
                                aria-hidden="true"
                                className="mt-0.5 size-5 shrink-0 text-brand"
                            />
                            <p className="text-sm leading-6 text-foreground-secondary">
                                {isPending
                                    ? 'Admin có thể xem trước file trước khi quyết định. Chỉ tài liệu được duyệt mới chuyển sang PUBLIC.'
                                    : 'Quyết định đã được lưu; tài liệu không còn ở hàng chờ duyệt.'}
                            </p>
                        </div>
                    </section>
                </aside>
                <div>
                    {previewQuery.isLoading ? (
                        <Skeleton className="h-[38rem] w-full rounded-2xl" />
                    ) : previewQuery.isError ? (
                        <section className="grid min-h-[38rem] place-items-center rounded-2xl bg-surface p-8 text-center shadow-soft">
                            <p className="text-sm text-feedback-danger">
                                Không tạo được preview URL.
                            </p>
                        </section>
                    ) : (
                        <PreviewPane preview={previewQuery.data} />
                    )}
                </div>
            </div>
            <ConfirmDialog
                confirmLabel={
                    decision === 'REJECTED' ? 'Từ chối' : 'Duyệt và public'
                }
                description={
                    decision === 'REJECTED'
                        ? `Tài liệu sẽ bị từ chối và giữ ở chế độ ẩn. Lý do: ${rejectionReason}`
                        : 'Tài liệu sẽ được chuyển sang PUBLIC và hiển thị cho người dùng.'
                }
                isOpen={isConfirmOpen}
                isPending={reviewMutation.isPending}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => void confirmReview()}
                title={
                    decision === 'REJECTED'
                        ? 'Xác nhận từ chối tài liệu?'
                        : 'Xác nhận duyệt tài liệu?'
                }
                tone={decision === 'REJECTED' ? 'danger' : 'primary'}
            />
        </div>
    );
}
