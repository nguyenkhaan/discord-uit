import { Search, X } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { MultiSelectBox } from '@/components/common/MultiSelectBox';
import type { SelectOption } from '@/components/common/select.types';
import type {
    TaxonomyCollection,
    TaxonomyTag,
} from '@/features/taxonomy/taxonomy.type';
import {
    createEmptyDocumentFilter,
    type DocumentFilterValue,
} from '@/features/documents/document-filter.utils';

interface DocumentFilterProps {
    collections: TaxonomyCollection[];
    tags: TaxonomyTag[];
    value: DocumentFilterValue;
    onChange: (value: DocumentFilterValue) => void;
}

export function DocumentFilter({
    collections,
    tags,
    value,
    onChange,
}: DocumentFilterProps) {
    const selectedCount =
        value.collectionSlugs.length +
        value.tagSlugs.length +
        (value.search.trim() ? 1 : 0);
    const collectionOptions: SelectOption[] = collections.map((collection) => ({
        description: `${collection.documentCount} tài liệu`,
        label: collection.name,
        value: collection.slug,
    }));
    const tagOptions: SelectOption[] = tags.map((tag) => ({
        description: `${tag.documentCount} tài liệu`,
        label: tag.name,
        value: tag.slug,
    }));

    function clearFilters() {
        onChange(createEmptyDocumentFilter());
    }

    return (
        <section
            aria-labelledby="document-filter-heading"
            className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-soft sm:p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div>
                        <h2
                            className="font-bold text-heading"
                            id="document-filter-heading"
                        >
                            Lọc tài liệu
                        </h2>
                    </div>
                </div>
                {selectedCount > 0 && (
                    <Button
                        aria-label="Xóa tất cả bộ lọc tài liệu"
                        onClick={clearFilters}
                        size="compact"
                        variant="secondary"
                    >
                        <X aria-hidden="true" className="size-4" />
                        Xóa bộ lọc ({selectedCount})
                    </Button>
                )}
            </div>

            <div className="mt-5">
                <label
                    className="mb-2 block text-sm font-semibold text-heading"
                    htmlFor="document-filter-search"
                >
                    Tìm theo tên hoặc slug
                </label>
                <Input
                    aria-describedby="document-filter-search-help"
                    id="document-filter-search"
                    onChange={(event) =>
                        onChange({ ...value, search: event.target.value })
                    }
                    placeholder="Nhập tên hoặc slug tài liệu..."
                    startIcon={<Search className="size-4" />}
                    type="search"
                    value={value.search}
                />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MultiSelectBox
                    emptyMessage="Không tìm thấy collection."
                    id="document-filter-collections"
                    label="Collections"
                    onChange={(collectionSlugs) =>
                        onChange({ ...value, collectionSlugs })
                    }
                    options={collectionOptions}
                    placeholder="Tất cả collections"
                    searchPlaceholder="Tìm collection..."
                    value={value.collectionSlugs}
                />
                <MultiSelectBox
                    emptyMessage="Không tìm thấy tag."
                    id="document-filter-tags"
                    label="Tags"
                    onChange={(tagSlugs) => onChange({ ...value, tagSlugs })}
                    options={tagOptions}
                    placeholder="Tất cả tags"
                    searchPlaceholder="Tìm tag..."
                    value={value.tagSlugs}
                />
            </div>
        </section>
    );
}
