import { FolderOpen, Hash, Save } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { MultiSelectBox } from '@/components/common/MultiSelectBox';
import type { SelectOption } from '@/components/common/select.types';
import { Skeleton } from '@/components/common/Skeleton';
import type {
    TaxonomyCollection,
    TaxonomyTag,
} from '@/features/taxonomy/taxonomy.type';
import { cn } from '@/lib/utils';

interface AdminDocumentTaxonomyEditorProps {
    collections: TaxonomyCollection[];
    isError: boolean;
    isLoading: boolean;
    isSaving: boolean;
    onCollectionChange: (slugs: string[]) => void;
    onRetry: () => void;
    onSave: () => void;
    onTagChange: (slugs: string[]) => void;
    assignedCollectionSlugs: string[];
    assignedTagSlugs: string[];
    selectedCollectionSlugs: string[];
    selectedTagSlugs: string[];
    tags: TaxonomyTag[];
    hasUnsavedChanges: boolean;
}

function withFallbackOptions(
    options: SelectOption[],
    ...slugGroups: string[][]
): SelectOption[] {
    const knownSlugs = new Set(options.map((option) => option.value));
    const fallbackSlugs = [...new Set(slugGroups.flat())];
    return [
        ...options,
        ...fallbackSlugs
            .filter((slug) => !knownSlugs.has(slug))
            .map((slug) => ({
                value: slug,
                label: slug,
                description: 'Đang giữ lựa chọn hiện tại',
            })),
    ];
}

function AssignedValues({
    emptyLabel,
    icon,
    values,
    variant,
}: {
    emptyLabel: string;
    icon: 'collection' | 'tag';
    values: string[];
    variant: 'brand' | 'violet';
}) {
    return values.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
    ) : (
        <div className="flex flex-wrap gap-2">
            {values.map((value) => (
                <span
                    className={cn(
                        'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                        variant === 'brand'
                            ? 'bg-brand-subtle text-brand'
                            : 'bg-violet-subtle text-feedback-violet'
                    )}
                    key={value}
                    title={value}
                >
                    {icon === 'collection' ? (
                        <FolderOpen
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                        />
                    ) : (
                        <Hash
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                        />
                    )}
                    <span className="max-w-full truncate">{value}</span>
                </span>
            ))}
        </div>
    );
}

export function AdminDocumentTaxonomyEditor({
    collections,
    isError,
    isLoading,
    isSaving,
    onCollectionChange,
    onRetry,
    onSave,
    onTagChange,
    assignedCollectionSlugs,
    assignedTagSlugs,
    selectedCollectionSlugs,
    selectedTagSlugs,
    tags,
    hasUnsavedChanges,
}: AdminDocumentTaxonomyEditorProps) {
    const collectionOptions = withFallbackOptions(
        collections.map((collection) => ({
            value: collection.slug,
            label: collection.name,
            description: collection.slug,
        })),
        selectedCollectionSlugs,
        assignedCollectionSlugs
    );
    const tagOptions = withFallbackOptions(
        tags.map((tag) => ({
            value: tag.slug,
            label: tag.name,
            description: tag.slug,
        })),
        selectedTagSlugs,
        assignedTagSlugs
    );
    const collectionNames = new Map(
        collections.map((collection) => [collection.slug, collection.name])
    );
    const tagNames = new Map(tags.map((tag) => [tag.slug, tag.name]));

    if (isLoading) {
        return (
            <section
                aria-label="Đang tải phân loại tài liệu"
                className="rounded-2xl bg-surface p-5 shadow-soft"
                role="status"
            >
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-2 h-4 w-64" />
                <div className="mt-5 grid gap-4">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section
                className="rounded-2xl bg-surface p-5 shadow-soft"
                role="alert"
            >
                <h2 className="font-bold text-heading">Taxonomy</h2>
                <p className="mt-2 text-sm text-feedback-danger">
                    Không tải được danh sách collection và tag.
                </p>
                <Button
                    className="mt-4"
                    onClick={onRetry}
                    size="compact"
                    variant="secondary"
                >
                    Thử lại
                </Button>
            </section>
        );
    }

    const assignedCollections = assignedCollectionSlugs.map(
        (slug) => collectionNames.get(slug) ?? slug
    );
    const assignedTags = assignedTagSlugs.map(
        (slug) => tagNames.get(slug) ?? slug
    );

    return (
        <section className="rounded-2xl bg-surface p-5 shadow-soft">
            <h2 className="mt-1 font-bold text-base sm:text-lg text-foreground-secondary">
                Thư mục & Tags
            </h2>
            <div className="mt-5 grid gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase text-muted">
                        Thư mục
                    </p>
                    <div className="mt-2">
                        <AssignedValues
                            emptyLabel="Chưa gán collection nào."
                            icon="collection"
                            values={assignedCollections}
                            variant="brand"
                        />
                    </div>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase text-muted">
                        Tags
                    </p>
                    <div className="mt-2">
                        <AssignedValues
                            emptyLabel="Chưa gán tag nào."
                            icon="tag"
                            values={assignedTags}
                            variant="violet"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-line-subtle pt-5">
                <MultiSelectBox
                    aria-label="Chọn collections cho tài liệu"
                    label="Chọn collections"
                    onChange={onCollectionChange}
                    options={collectionOptions}
                    placeholder="Chọn một hoặc nhiều collection"
                    searchPlaceholder="Tìm collection..."
                    value={selectedCollectionSlugs}
                />
                <MultiSelectBox
                    aria-label="Chọn tags cho tài liệu"
                    label="Chọn tags"
                    onChange={onTagChange}
                    options={tagOptions}
                    placeholder="Chọn một hoặc nhiều tag"
                    searchPlaceholder="Tìm tag..."
                    value={selectedTagSlugs}
                />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4">
                <p className="text-xs text-muted" role="status">
                </p>
                <Button
                    disabled={!hasUnsavedChanges || isSaving}
                    onClick={onSave}
                    size="compact"
                >
                    <Save aria-hidden="true" className="size-4" />
                    {isSaving ? 'Đang lưu...' : 'Lưu phân loại'}
                </Button>
            </div>
        </section>
    );
}
