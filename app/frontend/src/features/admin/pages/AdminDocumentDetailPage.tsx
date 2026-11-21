import {
    ArrowLeft,
    Clock3,
    Download,
    FileCode2,
    FileText,
    Hash,
    LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import {
    useAdminCollectionsQuery,
    useAdminTagsQuery,
} from '@/features/taxonomy/taxonomy.hooks';
import { mockAdminDocuments } from '@/features/documents/admin-document.mock';
import type {
    AdminDocument,
    AdminDocumentStatus,
} from '@/features/documents/admin-document.type';
import {
    formatDocumentStatus,
    getInitialDocumentDecision,
    type AdminDocumentDecision,
} from '@/features/documents/admin-document.utils';
import { formatAdminDate, formatAdminTime } from '@/features/admin/admin.utils';
import type { AdminTone } from '@/features/admin/admin.type';
import { showToast } from '@/lib/toast';

function getStatusTone(status: AdminDocumentStatus): AdminTone {
    if (status === 'PENDING') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'danger';
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

function DocumentNotFound() {
    return (
        <div className="rounded-2xl border border-dashed border-line-brand bg-surface p-12 text-center">
            <FileText
                aria-hidden="true"
                className="mx-auto size-10 text-placeholder"
            />
            <h1 className="mt-4 text-2xl font-bold text-heading">
                Không tìm thấy tài liệu
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary">
                Tài liệu này có thể đã bị xóa hoặc không còn khả dụng.
            </p>
            <Link
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-brand bg-surface px-3 text-sm font-bold text-brand transition-colors hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                to="/admin/documents/list"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Quay lại danh sách
            </Link>
        </div>
    );
}

function PreviewPane({ document }: { document: AdminDocument }) {
    const previewTitle =
        document.previewKind === 'HTML'
            ? 'HTML preview'
            : `${document.previewKind} preview`;

    return (
        <section className="overflow-hidden rounded-2xl bg-surface shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-subtle text-brand">
                        <FileCode2 aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-bold text-heading">Xem trước</h2>
                        <p className="text-xs text-muted">{previewTitle}</p>
                    </div>
                </div>
                <span className="rounded-md bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-muted">
                    {document.fileType}
                </span>
            </div>

            <div className="min-h-[32rem] bg-[#f8fafc] p-4 sm:p-6">
                {document.previewKind === 'HTML' ? (
                    <article
                        className="mx-auto min-h-[28rem] max-w-3xl rounded-xl border border-line-subtle bg-white p-6 text-slate-700 shadow-sm sm:p-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-7"
                        dangerouslySetInnerHTML={{
                            __html: document.previewHtml,
                        }}
                    />
                ) : (
                    <div className="mx-auto flex min-h-[28rem] max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-line-brand bg-white px-6 text-center">
                        <span className="grid size-16 place-items-center rounded-2xl bg-brand-subtle text-brand">
                            <FileText aria-hidden="true" className="size-8" />
                        </span>
                        <h3 className="mt-5 text-lg font-bold text-heading">
                            Preview {document.fileType} mock
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                            Khu vực này sẽ hiển thị nội dung {document.fileType}{' '}
                            sau khi kết nối API/media viewer. Hiện tại admin vẫn
                            có thể xem metadata và quyết định duyệt tài liệu.
                        </p>
                        <Button
                            className="mt-5"
                            size="compact"
                            variant="secondary"
                        >
                            <Download aria-hidden="true" className="size-4" />
                            Tải file xem thử
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function AdminDocumentDetailPage() {
    const { documentId } = useParams<{ documentId: string }>();
    const document = mockAdminDocuments.find((item) => item.id === documentId);
    const collectionsQuery = useAdminCollectionsQuery();
    const tagsQuery = useAdminTagsQuery();
    const [statusOverride, setStatusOverride] =
        useState<AdminDocumentStatus | null>(null);
    const [selectedDecision, setSelectedDecision] = useState<
        AdminDocumentDecision | ''
    >(() => getInitialDocumentDecision(document?.status ?? 'PENDING'));
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    if (!document) return <DocumentNotFound />;

    if (collectionsQuery.isLoading || tagsQuery.isLoading) {
        return (
            <section
                aria-label="Đang tải taxonomy tài liệu"
                className="rounded-2xl border border-line-subtle bg-surface p-12 text-center shadow-soft"
            >
                <LoaderCircle
                    aria-hidden="true"
                    className="mx-auto size-8 animate-spin text-brand motion-reduce:animate-none"
                />
                <p className="mt-3 text-sm font-medium text-foreground">
                    Đang tải taxonomy tài liệu...
                </p>
            </section>
        );
    }

    const status = statusOverride ?? document.status;
    const collectionsBySlug = new Map(
        (collectionsQuery.data?.items ?? []).map((item) => [item.slug, item])
    );
    const tagsBySlug = new Map(
        (tagsQuery.data?.items ?? []).map((item) => [item.slug, item])
    );
    const collections = document.collectionSlugs
        .map((slug) => collectionsBySlug.get(slug))
        .filter((item) => item !== undefined);
    const tags = document.tagSlugs
        .map((slug) => tagsBySlug.get(slug))
        .filter((item) => item !== undefined);
    const hasUnsavedDecision =
        selectedDecision !== '' && selectedDecision !== status;

    function saveDocumentStatus() {
        if (!hasUnsavedDecision) return;
        setIsSaveDialogOpen(true);
    }

    function confirmSaveDocumentStatus() {
        if (!selectedDecision) return;
        setStatusOverride(selectedDecision);
        setIsSaveDialogOpen(false);
        showToast(
            selectedDecision === 'APPROVED'
                ? 'Tài liệu đã được đồng ý và lưu chính thức.'
                : 'Tài liệu đã bị từ chối.'
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <Link
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                to="/admin/documents/list"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Quay lại danh sách tài liệu
            </Link>

            <AdminPageHeader
                action={
                    <div className="w-full shrink-0 sm:w-48">
                        <label
                            className="mb-1 block text-xs font-medium text-foreground-secondary"
                            htmlFor="document-decision"
                        >
                            Trạng thái tài liệu
                        </label>
                        <select
                            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface px-3 text-sm text-foreground transition-colors hover:border-line-brand-hover focus-visible:border-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
                            id="document-decision"
                            onChange={(event) =>
                                setSelectedDecision(
                                    event.target.value as
                                        AdminDocumentDecision | ''
                                )
                            }
                            value={selectedDecision}
                        >
                            <option value="">Chọn trạng thái</option>
                            <option value="APPROVED">Đồng ý</option>
                            <option value="REJECTED">Từ chối</option>
                        </select>
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
                                    tone={getStatusTone(status)}
                                    withDot
                                >
                                    {formatDocumentStatus(status)}
                                </AdminBadge>
                                <h2 className="mt-3 text-lg font-bold text-heading">
                                    {document.title}
                                </h2>
                                <p className="mt-1 break-all text-xs text-muted">
                                    {document.slug}
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-6 text-foreground-secondary">
                            {document.summary}
                        </p>
                    </section>

                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <h2 className="font-bold text-heading">Metadata</h2>
                        <dl className="mt-2">
                            <MetadataRow
                                label="Tên file"
                                value={document.fileName}
                            />
                            <MetadataRow
                                label="Định dạng"
                                value={document.fileType}
                            />
                            <MetadataRow
                                label="Kích thước"
                                value={document.fileSize}
                            />
                            <MetadataRow
                                label="Số trang"
                                value={String(document.pageCount)}
                            />
                            <MetadataRow
                                label="Phiên bản"
                                value={`v${document.version}`}
                            />
                            <MetadataRow
                                label="Người gửi"
                                value={document.submittedBy}
                            />
                            <MetadataRow
                                label="Thời gian gửi"
                                value={`${formatAdminDate(document.submittedAt)} ${formatAdminTime(document.submittedAt)}`}
                            />
                        </dl>
                    </section>

                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <h2 className="font-bold text-heading">Taxonomy</h2>
                        <div className="mt-4 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                                    Collections
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {collections.map((collection) => (
                                        <Link
                                            className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-subtle/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                            key={collection.id}
                                            to={`/admin/documents/list?collection=${collection.slug}`}
                                        >
                                            {collection.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                                    Tags
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-full bg-violet-subtle px-3 py-1.5 text-xs font-semibold text-feedback-violet"
                                            key={tag.id}
                                        >
                                            <Hash
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-surface p-5 shadow-soft">
                        <div className="flex items-start gap-3">
                            <Clock3
                                aria-hidden="true"
                                className="mt-0.5 size-5 shrink-0 text-brand"
                            />
                            <div>
                                <h2 className="font-bold text-heading">
                                    Lưu trạng thái
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                                    Chọn trạng thái ở phía trên rồi bấm Lưu để
                                    xác nhận thay đổi.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="mt-4 w-full"
                            disabled={!hasUnsavedDecision}
                            onClick={saveDocumentStatus}
                            size="compact"
                        >
                            Lưu
                        </Button>
                        {!hasUnsavedDecision && selectedDecision !== '' && (
                            <p className="mt-3 text-xs font-medium text-foreground-secondary">
                                Trạng thái hiện tại:{' '}
                                {formatDocumentStatus(status)}.
                            </p>
                        )}
                    </section>
                </aside>

                <PreviewPane document={document} />
            </div>

            <ConfirmDialog
                confirmLabel={
                    selectedDecision === 'REJECTED' ? 'Từ chối' : 'Đồng ý'
                }
                description={
                    selectedDecision === 'REJECTED'
                        ? 'Tài liệu sẽ được đánh dấu từ chối và không được lưu vào danh sách tài liệu chính thức.'
                        : 'Tài liệu sẽ được đánh dấu đồng ý và lưu vào danh sách tài liệu chính thức.'
                }
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                onConfirm={confirmSaveDocumentStatus}
                title={
                    selectedDecision === 'REJECTED'
                        ? 'Xác nhận từ chối tài liệu?'
                        : 'Xác nhận đồng ý tài liệu?'
                }
                tone={selectedDecision === 'REJECTED' ? 'danger' : 'primary'}
            />
        </div>
    );
}
