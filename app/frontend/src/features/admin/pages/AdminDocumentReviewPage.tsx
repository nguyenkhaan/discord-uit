import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Download,
    FileCode2,
    FileText,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderAsync } from 'docx-preview';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/common/Skeleton';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminDocumentClassificationPanel } from '@/features/admin/components/AdminDocumentClassificationPanel';
import { AdminDocumentTaxonomyEditor } from '@/features/admin/components/AdminDocumentTaxonomyEditor';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { formatAdminDate, formatAdminTime } from '@/features/admin/admin.utils';
import { hasTaxonomySelectionChanged } from '@/features/admin/admin-document-taxonomy.utils';
import type { AdminTone } from '@/features/admin/admin.type';
import { formatFileSize } from '@/features/documents/document.format';
import {
    useAdminDocumentClassificationQuery,
    useAdminDocumentPreviewQuery,
    useUpdateAdminDocumentTaxonomyMutation,
    useAdminSubmissionsQuery,
    useReviewAdminDocumentMutation,
} from '@/features/documents/document.hooks';
import {
    useAdminCollectionsQuery,
    useAdminTagsQuery,
} from '@/features/taxonomy/taxonomy.hooks';
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

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle py-3 last:border-b-0">
            <dt className="shrink-0 text-sm text-muted">{label}</dt>
            <dd
                className="min-w-0 max-w-[65%] flex-1 text-right text-sm font-medium text-foreground"
                title={value}
            >
                <span className="line-clamp-3 break-all">{value}</span>
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
        <pre className="min-h-full whitespace-pre-wrap p-6 text-left text-sm leading-6 text-slate-700">
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
                className="block h-full min-h-[30rem] w-full border-0"
                src={preview.previewUrl}
                title={`Xem trước ${preview.fileName}`}
            />
        );
    }
    if (extension === 'docx') {
        return <div className="min-h-full bg-white p-3" ref={containerRef} />;
    }
    if (extension === 'txt') return <TextPreview url={preview.previewUrl} />;
    return (
        <div className="grid h-full min-h-[30rem] place-items-center p-8 text-center">
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
            <div className="h-[clamp(30rem,72vh,52rem)] bg-[#f8fafc] p-4 sm:p-6">
                <div className="mx-auto h-full min-w-0 max-w-4xl overflow-y-auto overscroll-contain rounded-xl border border-line-subtle bg-white shadow-sm">
                    {preview ? (
                        <DocumentViewer preview={preview} />
                    ) : (
                        <div className="grid h-full min-h-[30rem] place-items-center text-sm text-muted">
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

interface TaxonomyDraft {
    submissionId: string;
    collectionSlugs: string[];
    tagSlugs: string[];
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
    const collectionsQuery = useAdminCollectionsQuery();
    const tagsQuery = useAdminTagsQuery();
    const submission = submissionsQuery.data?.find(
        (item) =>
            item.submissionId === documentId || item.documentId === documentId
    );
    const classificationQuery = useAdminDocumentClassificationQuery(
        submission?.submissionId,
        submission?.submissionStatus === 'PENDING_PROCESSING'
    );
    const classificationStatus = classificationQuery.data?.status;
    const refreshAdminQueue = submissionsQuery.refetch;
    useEffect(() => {
        if (classificationStatus !== undefined) void refreshAdminQueue();
    }, [classificationStatus, refreshAdminQueue]);
    const previewQuery = useAdminDocumentPreviewQuery(submission?.submissionId);
    const reviewMutation = useReviewAdminDocumentMutation();
    const taxonomyMutation = useUpdateAdminDocumentTaxonomyMutation();
    const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | ''>('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRecoveringTaxonomy, setIsRecoveringTaxonomy] = useState(false);
    const [taxonomyDraft, setTaxonomyDraft] = useState<TaxonomyDraft | null>(
        null
    );

    if (submissionsQuery.isLoading) {
        return (
            <div className="space-y-6 pb-10">
                <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-brand-active"
                    to="/admin/documents/list"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Quay lại danh sách tài liệu
                </Link>
                <AdminPageHeader title="Chi tiết tài liệu" />
                <DetailSkeleton />
            </div>
        );
    }
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

    const currentSubmission = submission;
    const isPending = currentSubmission.submissionStatus === 'PENDING_REVIEW';
    const canConfirm =
        decision !== '' &&
        (decision !== 'REJECTED' || rejectionReason.trim() !== '');
    const submissionId = currentSubmission.submissionId;
    const currentDraft =
        taxonomyDraft?.submissionId === submissionId
            ? taxonomyDraft
            : {
                  submissionId,
                  collectionSlugs: currentSubmission.collectionSlugs,
                  tagSlugs: currentSubmission.tagSlugs,
              };
    const selectedCollectionSlugs = currentDraft.collectionSlugs;
    const selectedTagSlugs = currentDraft.tagSlugs;
    const hasUnsavedTaxonomyChanges = hasTaxonomySelectionChanged(
        {
            collectionSlugs: selectedCollectionSlugs,
            tagSlugs: selectedTagSlugs,
        },
        {
            collectionSlugs: currentSubmission.collectionSlugs,
            tagSlugs: currentSubmission.tagSlugs,
        }
    );
    const currentDocumentId = currentSubmission.documentId;

    function updateTaxonomyDraft(
        changes: Partial<Pick<TaxonomyDraft, 'collectionSlugs' | 'tagSlugs'>>
    ) {
        setTaxonomyDraft((current) => {
            const nextDraft = {
                submissionId,
                collectionSlugs:
                    current?.submissionId === submissionId
                        ? current.collectionSlugs
                        : currentSubmission.collectionSlugs,
                tagSlugs:
                    current?.submissionId === submissionId
                        ? current.tagSlugs
                        : currentSubmission.tagSlugs,
                ...changes,
            };

            if (
                !taxonomyMutation.isPending &&
                !isRecoveringTaxonomy &&
                !hasTaxonomySelectionChanged(nextDraft, {
                    collectionSlugs: currentSubmission.collectionSlugs,
                    tagSlugs: currentSubmission.tagSlugs,
                })
            ) {
                return null;
            }

            return nextDraft;
        });
    }

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

    async function saveTaxonomy() {
        if (
            !hasUnsavedTaxonomyChanges ||
            taxonomyMutation.isPending ||
            isRecoveringTaxonomy
        ) {
            return;
        }
        const submittedTaxonomy = {
            collectionSlugs: [...selectedCollectionSlugs],
            tagSlugs: [...selectedTagSlugs],
        };
        try {
            await taxonomyMutation.mutateAsync({
                documentId: currentDocumentId,
                ...submittedTaxonomy,
            });
            setTaxonomyDraft((current) => {
                if (current?.submissionId !== submissionId) return current;

                const hasNewerChanges = hasTaxonomySelectionChanged(
                    current,
                    submittedTaxonomy
                );
                return hasNewerChanges ? current : null;
            });
            showToast('Đã cập nhật collection và tag cho tài liệu.');
        } catch {
            setIsRecoveringTaxonomy(true);
            try {
                const refreshedSubmissions = await submissionsQuery.refetch();
                const refreshedSubmission =
                    refreshedSubmissions.isSuccess &&
                    refreshedSubmissions.data?.find(
                        (item) => item.submissionId === submissionId
                    );
                if (refreshedSubmission) {
                    setTaxonomyDraft((current) => {
                        if (current?.submissionId !== submissionId)
                            return current;

                        const matchesPersistedTaxonomy =
                            !hasTaxonomySelectionChanged(current, {
                                collectionSlugs:
                                    refreshedSubmission.collectionSlugs,
                                tagSlugs: refreshedSubmission.tagSlugs,
                            });
                        return matchesPersistedTaxonomy ? null : current;
                    });
                }
            } finally {
                setIsRecoveringTaxonomy(false);
            }
            showToast('Không thể lưu taxonomy. Vui lòng thử lại.');
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
                                value={formatFileSize(submission.sizeBytes)}
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
                    <AdminDocumentClassificationPanel
                        classification={classificationQuery.data}
                        isError={classificationQuery.isError}
                        isLoading={classificationQuery.isLoading}
                        mediaStatus={currentSubmission.mediaStatus}
                        onRetryLoad={() => void classificationQuery.refetch()}
                        submissionId={submissionId}
                        submissionStatus={currentSubmission.submissionStatus}
                    />
                    <AdminDocumentTaxonomyEditor
                        collections={collectionsQuery.data?.items ?? []}
                        hasUnsavedChanges={hasUnsavedTaxonomyChanges}
                        isError={collectionsQuery.isError || tagsQuery.isError}
                        isLoading={
                            collectionsQuery.isLoading || tagsQuery.isLoading
                        }
                        isSaving={
                            taxonomyMutation.isPending || isRecoveringTaxonomy
                        }
                        onCollectionChange={(values) =>
                            updateTaxonomyDraft({ collectionSlugs: values })
                        }
                        onRetry={() => {
                            void collectionsQuery.refetch();
                            void tagsQuery.refetch();
                        }}
                        onSave={() => void saveTaxonomy()}
                        onTagChange={(values) =>
                            updateTaxonomyDraft({ tagSlugs: values })
                        }
                        assignedCollectionSlugs={
                            currentSubmission.collectionSlugs
                        }
                        assignedTagSlugs={currentSubmission.tagSlugs}
                        selectedCollectionSlugs={selectedCollectionSlugs}
                        selectedTagSlugs={selectedTagSlugs}
                        tags={tagsQuery.data?.items ?? []}
                    />
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
