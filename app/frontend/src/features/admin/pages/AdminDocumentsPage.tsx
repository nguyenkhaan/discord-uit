import {
    AlertTriangle,
    FileText,
    FolderOpen,
    Hash,
    LoaderCircle,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs } from '@/components/common/Tabs';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminTaxonomyFormModal } from '@/features/admin/components/AdminTaxonomyFormModal';
import { AdminTaxonomyTable } from '@/features/admin/components/AdminTaxonomyTable';
import {
    mockTaxonomyCollections,
    mockTaxonomyTags,
} from '@/features/taxonomy/taxonomy.mock';
import type {
    TaxonomyCollection,
    TaxonomyFormValues,
    TaxonomyItem,
    TaxonomyKind,
    TaxonomyTag,
} from '@/features/taxonomy/taxonomy.type';
import { showToast } from '@/lib/toast';

function isCollection(item: TaxonomyItem): item is TaxonomyCollection {
    return 'keywords' in item;
}

export default function AdminDocumentsPage() {
    const [collections, setCollections] = useState(mockTaxonomyCollections);
    const [tags, setTags] = useState(mockTaxonomyTags);
    const [activeTab, setActiveTab] = useState<TaxonomyKind>('collection');
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [modalKind, setModalKind] = useState<TaxonomyKind>('collection');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TaxonomyItem | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setIsLoading(false), 320);
        return () => window.clearTimeout(timeoutId);
    }, []);

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

    function saveTaxonomy(values: TaxonomyFormValues): string | undefined {
        const currentItems = modalKind === 'collection' ? collections : tags;
        const normalizedName = values.name.toLocaleLowerCase();
        const conflict = currentItems.some(
            (item) =>
                item.id !== editingItem?.id &&
                (item.name.toLocaleLowerCase() === normalizedName ||
                    item.slug === values.slug)
        );
        if (conflict) {
            return 'Tên hoặc slug đã tồn tại. Hãy chọn giá trị khác.';
        }

        const updatedAt = new Date().toISOString();
        if (modalKind === 'collection') {
            const current =
                editingItem && isCollection(editingItem) ? editingItem : null;
            const next: TaxonomyCollection = {
                id: current?.id ?? `collection-${Date.now()}`,
                name: values.name,
                slug: values.slug,
                description: values.description,
                keywords: values.keywords,
                documentCount: current?.documentCount ?? 0,
                classificationCount: current?.classificationCount ?? 0,
                tagSlugs: current?.tagSlugs ?? [],
                updatedAt,
            };
            setCollections((items) =>
                current
                    ? items.map((item) =>
                          item.id === current.id ? next : item
                      )
                    : [next, ...items]
            );
        } else {
            const current =
                editingItem && !isCollection(editingItem) ? editingItem : null;
            const next: TaxonomyTag = {
                id: current?.id ?? `tag-${Date.now()}`,
                name: values.name,
                slug: values.slug,
                description: values.description,
                documentCount: current?.documentCount ?? 0,
                classificationCount: current?.classificationCount ?? 0,
                updatedAt,
            };
            setTags((items) =>
                current
                    ? items.map((item) =>
                          item.id === current.id ? next : item
                      )
                    : [next, ...items]
            );
        }

        showToast(
            `${modalKind === 'collection' ? 'Collection' : 'Tag'} đã được lưu.`
        );
        closeForm();
        return undefined;
    }

    function requestDelete(item: TaxonomyItem) {
        setDeleteTarget(item);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        const isReferenced =
            deleteTarget.documentCount > 0 ||
            deleteTarget.classificationCount > 0;
        if (isReferenced) {
            showToast(
                `Không thể xóa ${isCollection(deleteTarget) ? 'collection' : 'tag'} đang được tài liệu hoặc AI sử dụng.`
            );
            setDeleteTarget(null);
            return;
        }

        if (isCollection(deleteTarget)) {
            setCollections((items) =>
                items.filter((item) => item.id !== deleteTarget.id)
            );
        } else {
            setTags((items) =>
                items.filter((item) => item.id !== deleteTarget.id)
            );
        }
        showToast(
            `${isCollection(deleteTarget) ? 'Collection' : 'Tag'} đã được xóa.`
        );
        setDeleteTarget(null);
    }

    function retryMockLoad() {
        setHasLoadError(false);
        setIsLoading(true);
        window.setTimeout(() => setIsLoading(false), 320);
    }

    const deleteIsBlocked =
        deleteTarget !== null &&
        (deleteTarget.documentCount > 0 ||
            deleteTarget.classificationCount > 0);
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
                description="Quản lý collections và tags dùng để phân loại, duyệt và khám phá tài liệu trên UIT Connect."
                title="Quản lý tài liệu"
            />

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
                    <p className="text-sm text-muted">Đang được sử dụng</p>
                    <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                        {referencedCount}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        Không thể xóa trực tiếp
                    </p>
                </div>
            </div>

            {isLoading ? (
                <section
                    aria-label="Đang tải taxonomy"
                    className="rounded-xl border border-line-subtle bg-surface p-10 shadow-soft"
                >
                    <div className="flex flex-col items-center justify-center text-center">
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-8 animate-spin text-brand motion-reduce:animate-none"
                        />
                        <p className="mt-3 text-sm font-medium text-foreground">
                            Đang tải danh mục taxonomy...
                        </p>
                    </div>
                </section>
            ) : hasLoadError ? (
                <section
                    aria-live="assertive"
                    className="rounded-xl border border-danger-border bg-danger-subtle p-10 text-center"
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
                        onClick={retryMockLoad}
                        size="compact"
                        variant="secondary"
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Thử lại
                    </Button>
                </section>
            ) : (
                <Tabs
                    items={tabItems}
                    label="Quản lý collections và tags"
                    onValueChange={setActiveTab}
                    value={activeTab}
                />
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
                        ? `Không thể xóa ${deleteLabel} "${deleteTarget?.name}" vì đang được document hoặc AI classification sử dụng.`
                        : `Bạn chắc chắn muốn xóa ${deleteLabel} "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`
                }
                isOpen={deleteTarget !== null}
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
