import { FolderOpen, Hash, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { AdminBadge } from '@/features/admin/components/AdminBadge';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import {
    AdminRowMenu,
    type AdminRowMenuItem,
} from '@/features/admin/components/AdminRowMenu';
import { AdminTableToolbar } from '@/features/admin/components/AdminTableToolbar';
import { AdminEmptyRow } from '@/features/admin/components/AdminTableStates';
import {
    ADMIN_TD_CLASS,
    ADMIN_TH_CLASS,
} from '@/features/admin/components/adminVariants';
import { formatAdminDate, paginate } from '@/features/admin/admin.utils';
import type {
    TaxonomyCollection,
    TaxonomyItem,
    TaxonomyKind,
} from '@/features/taxonomy/taxonomy.type';
import { cn } from '@/lib/utils';

interface AdminTaxonomyTableProps {
    kind: TaxonomyKind;
    items: TaxonomyItem[];
    onCreate: () => void;
    onDelete: (item: TaxonomyItem) => void;
    onEdit: (item: TaxonomyItem) => void;
}

const PAGE_SIZE = 6;
const COLUMN_COUNT = 6;

function isCollectionItem(item: TaxonomyItem): item is TaxonomyCollection {
    return 'keywords' in item;
}

function matchesSearch(item: TaxonomyItem, query: string): boolean {
    if (!query) return true;
    const values = [item.name, item.slug, item.description];
    if ('keywords' in item) values.push(...item.keywords);
    return values.some((value) => value.toLowerCase().includes(query));
}

function getUsageLabel(item: TaxonomyItem): string {
    const total = item.documentCount + item.classificationCount;
    return total === 0 ? 'Chưa được dùng' : `${item.documentCount} tài liệu`;
}

export function AdminTaxonomyTable({
    kind,
    items,
    onCreate,
    onDelete,
    onEdit,
}: AdminTaxonomyTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const isCollection = kind === 'collection';
    const label = isCollection ? 'collection' : 'tag';

    const filteredItems = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return items.filter((item) => matchesSearch(item, query));
    }, [items, searchTerm]);
    const pageSlice = paginate(filteredItems, currentPage, PAGE_SIZE);
    const isFiltering = searchTerm.trim() !== '';
    const EmptyIcon = isCollection ? FolderOpen : Hash;

    function updateSearch(value: string) {
        setSearchTerm(value);
        setCurrentPage(1);
    }

    function getMenuItems(item: TaxonomyItem): AdminRowMenuItem[] {
        return [
            {
                key: 'edit',
                label: 'Chỉnh sửa',
                icon: Pencil,
                onSelect: () => onEdit(item),
            },
            {
                key: 'delete',
                label: 'Xóa',
                icon: Trash2,
                tone: 'danger',
                dividerBefore: true,
                onSelect: () => onDelete(item),
            },
        ];
    }

    return (
        <section
            aria-label={`Danh sách ${label}`}
            className="overflow-hidden rounded-xl border border-line-subtle bg-surface shadow-soft"
        >
            <AdminTableToolbar
                action={
                    <Button
                        className="w-full sm:w-auto"
                        onClick={onCreate}
                        size="compact"
                    >
                        <Plus aria-hidden="true" className="size-4" />
                        Thêm {label}
                    </Button>
                }
                filters={
                    <p className="hidden self-center text-xs text-muted xl:block">
                        {items.length} {label} ·{' '}
                        {
                            items.filter(
                                (item) =>
                                    item.documentCount > 0 ||
                                    item.classificationCount > 0
                            ).length
                        }{' '}
                        đang được tham chiếu
                    </p>
                }
                onSearchChange={updateSearch}
                searchLabel={`Tìm kiếm ${label}`}
                searchPlaceholder={`Tìm theo tên, slug${isCollection ? ' hoặc từ khóa' : ''}...`}
                searchValue={searchTerm}
            />

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                    <thead className="bg-surface-subtle/60">
                        <tr>
                            <th
                                className={cn(ADMIN_TH_CLASS, 'w-12 pl-5')}
                                scope="col"
                            >
                                #
                            </th>
                            <th className={ADMIN_TH_CLASS} scope="col">
                                {isCollection ? 'Collection' : 'Tag'}
                            </th>
                            <th className={ADMIN_TH_CLASS} scope="col">
                                Slug
                            </th>
                            <th className={ADMIN_TH_CLASS} scope="col">
                                {isCollection ? 'Từ khóa' : 'Mô tả'}
                            </th>
                            <th className={ADMIN_TH_CLASS} scope="col">
                                Sử dụng
                            </th>
                            <th
                                className={cn(
                                    ADMIN_TH_CLASS,
                                    'pr-5 text-center'
                                )}
                                scope="col"
                            >
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                        {pageSlice.items.length === 0 ? (
                            <AdminEmptyRow
                                colSpan={COLUMN_COUNT}
                                emptyIcon={EmptyIcon}
                                emptyTitle={`Chưa có ${label} nào`}
                                isFiltering={isFiltering}
                            />
                        ) : (
                            pageSlice.items.map((item, index) => {
                                const collection = isCollectionItem(item)
                                    ? item
                                    : null;
                                const isUsed =
                                    item.documentCount > 0 ||
                                    item.classificationCount > 0;

                                return (
                                    <tr
                                        className="transition-colors hover:bg-surface-subtle/60"
                                        key={item.id}
                                    >
                                        <td
                                            className={cn(
                                                ADMIN_TD_CLASS,
                                                'pl-5 text-sm text-muted tabular-nums'
                                            )}
                                        >
                                            {pageSlice.start + index + 1}
                                        </td>
                                        <td className={ADMIN_TD_CLASS}>
                                            <div className="flex w-64 items-center gap-3">
                                                <span
                                                    className={cn(
                                                        'grid size-10 shrink-0 place-items-center rounded-lg',
                                                        isCollection
                                                            ? 'bg-brand-subtle text-brand'
                                                            : 'bg-violet-subtle text-feedback-violet'
                                                    )}
                                                >
                                                    {isCollection ? (
                                                        <FolderOpen
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    ) : (
                                                        <Hash
                                                            aria-hidden="true"
                                                            className="size-5"
                                                        />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {item.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        {item.description ||
                                                            'Chưa có mô tả'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            className={cn(
                                                ADMIN_TD_CLASS,
                                                'text-sm text-foreground-secondary'
                                            )}
                                        >
                                            <code className="rounded bg-surface-subtle px-2 py-1 text-xs text-brand">
                                                {item.slug}
                                            </code>
                                        </td>
                                        <td className={ADMIN_TD_CLASS}>
                                            {collection ? (
                                                <div className="flex max-w-72 flex-wrap gap-1.5">
                                                    {collection.keywords
                                                        .slice(0, 3)
                                                        .map((keyword) => (
                                                            <span
                                                                className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-foreground-secondary"
                                                                key={keyword}
                                                            >
                                                                {keyword}
                                                            </span>
                                                        ))}
                                                    {collection.keywords
                                                        .length > 3 && (
                                                        <span className="px-1 py-1 text-xs text-muted">
                                                            +
                                                            {collection.keywords
                                                                .length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="line-clamp-2 max-w-72 text-sm text-foreground-secondary">
                                                    {item.description ||
                                                        'Chưa có mô tả'}
                                                </p>
                                            )}
                                        </td>
                                        <td className={ADMIN_TD_CLASS}>
                                            <div className="space-y-1.5">
                                                <AdminBadge
                                                    tone={
                                                        isUsed
                                                            ? 'info'
                                                            : 'neutral'
                                                    }
                                                    withDot
                                                >
                                                    {getUsageLabel(item)}
                                                </AdminBadge>
                                                {item.classificationCount >
                                                    0 && (
                                                    <p className="text-xs text-muted">
                                                        {
                                                            item.classificationCount
                                                        }{' '}
                                                        gợi ý AI
                                                    </p>
                                                )}
                                                <time
                                                    className="block text-xs text-muted"
                                                    dateTime={item.updatedAt}
                                                >
                                                    Cập nhật{' '}
                                                    {formatAdminDate(
                                                        item.updatedAt
                                                    )}
                                                </time>
                                            </div>
                                        </td>
                                        <td
                                            className={cn(
                                                ADMIN_TD_CLASS,
                                                'pr-5'
                                            )}
                                        >
                                            <div className="flex justify-center">
                                                <AdminRowMenu
                                                    items={getMenuItems(item)}
                                                    label={`Thao tác với ${item.name}`}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <AdminPagination
                end={pageSlice.end}
                itemLabel={label}
                onPageChange={setCurrentPage}
                page={pageSlice.page}
                start={pageSlice.start}
                totalItems={filteredItems.length}
                totalPages={pageSlice.totalPages}
            />
        </section>
    );
}
