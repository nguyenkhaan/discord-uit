import { AlertTriangle, Brain, RefreshCw, Sparkles } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import {
    getClassificationStatusLabel,
    getClassificationStatusTone,
} from '@/features/admin/admin-document-classification.utils';
import { useRetryAdminDocumentClassificationMutation } from '@/features/documents/document.hooks';
import type {
    AdminDocumentClassification,
    ClassificationSuggestion,
    DocumentSubmissionStatus,
    MediaStatus,
} from '@/features/documents/document.type';
import { showToast } from '@/lib/toast';

function SuggestionList({
    label,
    suggestions,
}: {
    label: string;
    suggestions: ClassificationSuggestion[];
}) {
    return (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
            </h3>
            {suggestions.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Chưa có gợi ý.</p>
            ) : (
                <ul className="mt-2 space-y-2">
                    {suggestions.map((suggestion) => (
                        <li
                            className="flex items-center justify-between gap-3 text-sm"
                            key={suggestion.slug}
                        >
                            <span className="min-w-0 break-all text-foreground">
                                {suggestion.slug}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                                {Math.round(suggestion.confidence * 100)}%
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function AdminDocumentClassificationPanel({
    submissionId,
    submissionStatus,
    mediaStatus,
    classification,
    isLoading,
    isError,
    onRetryLoad,
}: {
    submissionId: string;
    submissionStatus: DocumentSubmissionStatus;
    mediaStatus: MediaStatus;
    classification: AdminDocumentClassification | undefined;
    isLoading: boolean;
    isError: boolean;
    onRetryLoad: () => void;
}) {
    const retryMutation = useRetryAdminDocumentClassificationMutation();

    if (isLoading) {
        return (
            <section
                aria-label="Đề xuất phân loại AI"
                className="space-y-4 rounded-2xl border border-line-subtle bg-surface p-5"
            >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
            </section>
        );
    }

    if (!classification) {
        return (
            <section
                aria-label="Đề xuất phân loại AI"
                className="rounded-2xl border border-line-subtle bg-surface p-5"
            >
                <h2 className="font-bold text-heading">Đề xuất phân loại AI</h2>
                <p className="mt-3 text-sm text-feedback-danger" role="alert">
                    Không tải được trạng thái phân loại.
                </p>
                <Button
                    className="mt-4"
                    onClick={onRetryLoad}
                    size="compact"
                    variant="secondary"
                >
                    Thử tải lại
                </Button>
            </section>
        );
    }

    const canRetry =
        (classification.status === 'FAILED' ||
            classification.status === 'DEAD_LETTER') &&
        submissionStatus === 'PENDING_PROCESSING' &&
        mediaStatus === 'READY';

    return (
        <section className="rounded-2xl border border-line-subtle bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Brain
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-brand"
                    />
                    <div>
                        <h2 className="font-bold text-heading">
                            Đề xuất phân loại AI
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            Gợi ý chỉ để tham khảo; admin vẫn chọn taxonomy cuối cùng.
                        </p>
                    </div>
                </div>
                <AdminBadge
                    tone={getClassificationStatusTone(classification.status)}
                    withDot
                >
                    {getClassificationStatusLabel(classification.status)}
                </AdminBadge>
            </div>

            {isError && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-feedback-danger/30 bg-feedback-danger/5 px-3 py-2">
                    <p className="text-sm text-feedback-danger" role="alert">
                        Không làm mới được trạng thái phân loại.
                    </p>
                    <Button
                        onClick={onRetryLoad}
                        size="compact"
                        variant="secondary"
                    >
                        Thử tải lại
                    </Button>
                </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line-subtle py-3 text-sm">
                <div>
                    <dt className="text-xs text-muted">Model</dt>
                    <dd className="mt-1 break-all font-medium text-foreground">
                        {classification.modelId ?? '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-muted">Lượt xử lý</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                        {classification.attemptCount}
                    </dd>
                </div>
            </dl>

            {(classification.status === 'FAILED' ||
                classification.status === 'DEAD_LETTER') && (
                <div className="mt-4 rounded-lg border border-feedback-danger/30 bg-feedback-danger/5 p-3">
                    <div className="flex items-start gap-2 text-sm text-feedback-danger">
                        <AlertTriangle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <div>
                            <p className="font-semibold">
                                {classification.failureCode ?? 'CLASSIFICATION_FAILED'}
                            </p>
                            <p className="mt-1 leading-5">
                                {classification.failureMessage ??
                                    'Không thể xử lý tài liệu.'}
                            </p>
                        </div>
                    </div>
                    {canRetry && (
                        <Button
                            className="mt-3"
                            disabled={retryMutation.isPending}
                            onClick={() =>
                                retryMutation.mutate(submissionId, {
                                    onSuccess: () =>
                                        showToast('Đã xếp lại tác vụ phân loại.'),
                                })
                            }
                            size="compact"
                            variant="secondary"
                        >
                            <RefreshCw
                                aria-hidden="true"
                                className="size-4"
                            />
                            {retryMutation.isPending
                                ? 'Đang xếp lại...'
                                : 'Thử phân loại lại'}
                        </Button>
                    )}
                </div>
            )}

            {retryMutation.isError && (
                <p className="mt-3 text-sm text-feedback-danger" role="alert">
                    Không thể xếp lại tác vụ. Hãy tải trạng thái mới rồi thử lại.
                </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SuggestionList
                    label="Collections được gợi ý"
                    suggestions={classification.collectionSuggestions}
                />
                <SuggestionList
                    label="Tags được gợi ý"
                    suggestions={classification.tagSuggestions}
                />
            </div>

            <div className="mt-4 border-t border-line-subtle pt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    Nội dung trích xuất
                    {classification.ocrNeeded && (
                        <span className="font-normal normal-case tracking-normal">
                            · có OCR
                        </span>
                    )}
                </h3>
                {classification.ocrText ? (
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-subtle p-3 text-xs leading-5 text-foreground-secondary">
                        {classification.ocrText}
                    </pre>
                ) : (
                    <p className="mt-2 text-sm text-muted">
                        Nội dung chưa được trích xuất.
                    </p>
                )}
            </div>
        </section>
    );
}
