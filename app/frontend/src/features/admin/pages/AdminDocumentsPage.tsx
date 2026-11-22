import {
    AlertTriangle,
    FileText,
    FolderOpen,
    Hash,
    RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs } from '@/components/common/Tabs';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminTaxonomyFormModal } from '@/features/admin/components/AdminTaxonomyFormModal';
import { AdminTaxonomyTable } from '@/features/admin/components/AdminTaxonomyTable';
import { Skeleton } from '@/components/common/Skeleton';
import {
    useAdminCollectionsQuery,
    useAdminTagsQuery,
    useCreateCollectionMutation,
    useCreateTagMutation,
    useDeleteCollectionMutation,
    useDeleteTagMutation,
    useUpdateCollectionMutation,
    useUpdateTagMutation,
} from '@/features/taxonomy/taxonomy.hooks';
import type {
    TaxonomyCollection,
    TaxonomyFormValues,
    TaxonomyItem,
    TaxonomyKind,
} from '@/features/taxonomy/taxonomy.type';
import { getTaxonomyErrorMessage } from '@/features/taxonomy/taxonomy.utils';
import { showToast } from '@/lib/toast';

function isCollection(item: TaxonomyItem): item is TaxonomyCollection {
    return 'keywords' in item;
}

function AdminTaxonomySkeleton() {
    return (
        <div aria-label="Đang tải taxonomy" className="space-y-6" role="status">
            <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                    <div
                        className="rounded-xl border border-line-subtle bg-surface p-4 shadow-soft"
                        key={item}
                    >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-3 h-8 w-16" />
                        <Skeleton className="mt-2 h-3 w-32" />
                    </div>
                ))}
            </div>
            <section className="overflow-hidden rounded-xl border border-line-subtle bg-surface shadow-soft">
                <div className="flex items-center justify-between border-b border-line-subtle p-4">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                <div className="space-y-4 p-4">
                    {[0, 1, 2, 3].map((item) => (
                        <Skeleton
                            className="h-14 w-full rounded-lg"
                            key={item}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default function AdminDocumentsPage() {
    const collectionsQuery = useAdminCollectionsQuery();
    const tagsQuery = useAdminTagsQuery();
    const createCollectionMutation = useCreateCollectionMutation();
    const updateCollectionMutation = useUpdateCollectionMutation();
    const deleteCollectionMutation = useDeleteCollectionMutation();
    const createTagMutation = useCreateTagMutation();
    const updateTagMutation = useUpdateTagMutation();
    const deleteTagMutation = useDeleteTagMutation();
    const collections = useMemo(
        () => collectionsQuery.data?.items ?? [],
        [collectionsQuery.data?.items]
    );
    const tags = useMemo(
        () => tagsQuery.data?.items ?? [],
        [tagsQuery.data?.items]
    );
    const [activeTab, setActiveTab] = useState<TaxonomyKind>('collection');
    const [modalKind, setModalKind] = useState<TaxonomyKind>('collection');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TaxonomyItem | null>(null);
    const [deleteError, setDeleteError] = useState<string>();

    const isLoading = collectionsQuery.isLoading || tagsQuery.isLoading;
    const hasLoadError = collectionsQuery.isError || tagsQuery.isError;

    const referencedCount = useMemo(
        () =>
            [...collections, ...tags].filter(
                (item) => item.documentCount > 0 || item.classificationCount > 0
            ).length,
        [collections, tags]
    );

    function openCreate(kind: TaxonomyKind) {
        setModalKind(kind);
        setEditingItem(null);
        setIsFormOpen(true);
    }

    function openEdit(item: TaxonomyItem) {
        setModalKind(isCollection(item) ? 'collection' : 'tag');
        setEditingItem(item);
        setIsFormOpen(true);
    }

    function closeForm() {
        setIsFormOpen(false);
        setEditingItem(null);
    }

    async function saveTaxonomy(
        values: TaxonomyFormValues
    ): Promise<string | undefined> {
        try {
            if (modalKind === 'collection') {
                if (editingItem && isCollection(editingItem)) {
                    await updateCollectionMutation.mutateAsync({
                        id: editingItem.id,
                        values,
                    });
                } else {
                    await createCollectionMutation.mutateAsync(values);
                }
            } else if (editingItem && !isCollection(editingItem)) {
                await updateTagMutation.mutateAsync({
                    id: editingItem.id,
                    values,
                });
            } else {
                await createTagMutation.mutateAsync(values);
            }
        } catch (error) {
            return getTaxonomyErrorMessage(
                error,
                'Không thể lưu taxonomy. Vui lòng thử lại.'
            );
        }

        showToast(
            `${modalKind === 'collection' ? 'Collection' : 'Tag'} đã được lưu.`
        );
        closeForm();
        return undefined;
    }

    function requestDelete(item: TaxonomyItem) {
        setDeleteError(undefined);
        setDeleteTarget(item);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        const isReferenced =
            deleteTarget.documentCount > 0 ||
            deleteTarget.classificationCount > 0;
        if (isReferenced || deleteError) {
            if (!deleteError) {
                setDeleteError(
                    `Không thể xóa ${isCollection(deleteTarget) ? 'collection' : 'tag'} đang được tài liệu hoặc AI sử dụng.`
                );
            } else {
                setDeleteTarget(null);
                setDeleteError(undefined);
            }
            return;
        }

        try {
            if (isCollection(deleteTarget)) {
                await deleteCollectionMutation.mutateAsync(deleteTarget.id);
            } else {
                await deleteTagMutation.mutateAsync(deleteTarget.id);
            }
        } catch (error) {
            setDeleteError(
                getTaxonomyErrorMessage(
                    error,
                    `Không thể xóa ${isCollection(deleteTarget) ? 'collection' : 'tag'}.`
                )
            );
            return;
        }
        showToast(
            `${isCollection(deleteTarget) ? 'Collection' : 'Tag'} đã được xóa.`
        );
        setDeleteTarget(null);
    }

    function retryLoad() {
        void Promise.all([collectionsQuery.refetch(), tagsQuery.refetch()]);
    }

    const deleteIsBlocked =
        deleteTarget !== null &&
        (deleteTarget.documentCount > 0 ||
            deleteTarget.classificationCount > 0 ||
            Boolean(deleteError));
    const deleteLabel = deleteTarget
        ? isCollection(deleteTarget)
            ? 'collection'
            : 'tag'
        : 'taxonomy';

    const tabItems = [
        {
            value: 'collection' as const,
            label: 'Collections',
            icon: FolderOpen,
            content: (
                <AdminTaxonomyTable
                    items={collections}
                    kind="collection"
                    onCreate={() => openCreate('collection')}
                    onDelete={requestDelete}
                    onEdit={openEdit}
                    onViewDocuments={(collection) =>
                        `/admin/documents/list?collection=${collection.slug}`
                    }
                />
            ),
        },
        {
            value: 'tag' as const,
            label: 'Tags',
            icon: Hash,
            content: (
                <AdminTaxonomyTable
                    items={tags}
                    kind="tag"
                    onCreate={() => openCreate('tag')}
                    onDelete={requestDelete}
                    onEdit={openEdit}
                />
            ),
        },
    ];

    return (
        <>
            <AdminPageHeader
                action={
                    <Link
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-bold text-on-brand transition-colors hover:bg-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        to="/admin/documents/list"
                    >
                        <FileText aria-hidden="true" className="size-4" />
                        Danh mục tài liệu
                    </Link>
                }
                description=""
                title="Quản lý tài liệu"
            />

            {isLoading ? (
                <AdminTaxonomySkeleton />
            ) : hasLoadError ? (
                <section
                    aria-live="assertive"
                    className="p-10 text-center"
                    role="alert"
                >
                    <AlertTriangle
                        aria-hidden="true"
                        className="mx-auto size-8 text-feedback-danger"
                    />
                    <h2 className="mt-3 font-semibold text-heading">
                        Không tải được taxonomy
                    </h2>
                    <p className="mt-1 text-sm text-foreground-secondary">
                        Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
                    </p>
                    <Button
                        className="mt-4"
                        onClick={retryLoad}
                        size="compact"
                        variant="secondary"
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Thử lại
                    </Button>
                </section>
            ) : (
                <>
                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-line-subtle bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">Collections</p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {collections.length}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Nhóm tài liệu public
                            </p>
                        </div>
                        <div className="rounded-xl border border-line-subtle bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">Tags</p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {tags.length}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Nhãn dùng cho filter
                            </p>
                        </div>
                        <div className="rounded-xl border border-line-subtle bg-surface p-4 shadow-soft">
                            <p className="text-sm text-muted">
                                Đang được sử dụng
                            </p>
                            <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                                {referencedCount}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Không thể xóa trực tiếp
                            </p>
                        </div>
                    </div>

                    <Tabs
                        items={tabItems}
                        label="Quản lý collections và tags"
                        onValueChange={setActiveTab}
                        value={activeTab}
                    />
                </>
            )}

            <AdminTaxonomyFormModal
                isOpen={isFormOpen}
                item={editingItem}
                kind={modalKind}
                key={`${modalKind}-${editingItem?.id ?? 'new'}-${isFormOpen ? 'open' : 'closed'}`}
                onClose={closeForm}
                onSave={saveTaxonomy}
            />

            <ConfirmDialog
                confirmLabel={
                    deleteIsBlocked ? 'Đã hiểu' : `Xóa ${deleteLabel}`
                }
                description={
                    deleteIsBlocked
                        ? (deleteError ??
                          `Không thể xóa ${deleteLabel} "${deleteTarget?.name}" vì đang được document hoặc AI classification sử dụng.`)
                        : `Bạn chắc chắn muốn xóa ${deleteLabel} "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`
                }
                isOpen={deleteTarget !== null}
                isPending={
                    deleteCollectionMutation.isPending ||
                    deleteTagMutation.isPending
                }
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={
                    deleteIsBlocked
                        ? 'Không thể xóa taxonomy'
                        : `Xóa ${deleteLabel}?`
                }
                tone={deleteIsBlocked ? 'primary' : 'danger'}
            />
        </>
    );
}
