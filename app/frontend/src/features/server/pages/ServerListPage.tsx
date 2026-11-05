import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { CreateServerModal } from '@/features/server/components/CreateServerModal';
import { ServerInviteModal } from '@/features/server/components/ServerInviteModal';
import { ServerSummary } from '@/features/server/components/ServerSummary';
import { ServerTableList } from '@/features/server/components/ServerTableList';
import { useServerList, useServerStatusCounts } from '@/features/server/server.hooks';
import { SERVER_STATUS_META, SERVER_STATUSES } from '@/features/server/server.status';
import type { ServerResponse, ServerStatus, ServerStatusFilter } from '@/features/server/server.type';

type SelectOption<T extends string> = { readonly value: T; readonly label: string };

type StatusFilter = 'ALL' | ServerStatus;

const STATUS_OPTIONS: readonly SelectOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Trạng thái: Tất cả' },
    ...SERVER_STATUSES.map((status) => ({ value: status, label: SERVER_STATUS_META[status].label })),
];

const CATEGORY_OPTIONS = [
    { value: 'ALL', label: 'Lĩnh vực: Tất cả' },
    { value: 'EDU', label: 'Học tập' },
] as const satisfies readonly SelectOption<string>[];

const SORT_OPTIONS = [
    { value: 'NEWEST', label: 'Sắp xếp: Mới nhất' },
    { value: 'OLDEST', label: 'Sắp xếp: Cũ nhất' },
] as const satisfies readonly SelectOption<string>[];

type CategoryFilter = (typeof CATEGORY_OPTIONS)[number]['value'];
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/** Type guard: kiểm tra giá trị từ <select> có thuộc danh sách option hợp lệ không */
function isOptionValue<T extends string>(options: readonly SelectOption<T>[], value: string): value is T {
    return options.some((option) => option.value === value);
}

const toTimestamp = (date?: string): number => (date ? new Date(date).getTime() : 0);

const SELECT_CLASS =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white cursor-pointer transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

interface FilterSelectProps<T extends string> {
    label: string;
    value: T;
    options: readonly SelectOption<T>[];
    onChange: (value: T) => void;
}

function FilterSelect<T extends string>({ label, value, options, onChange }: FilterSelectProps<T>) {
    return (
        <select
            value={value}
            aria-label={label}
            onChange={(e) => {
                const next = e.target.value;
                if (isOptionValue(options, next)) onChange(next);
            }}
            className={SELECT_CLASS}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function toServerStatusFilter(statusFilter: StatusFilter): ServerStatusFilter {
    return statusFilter === 'ALL' ? {} : { statuses: [statusFilter] };
}

export default function ServerListPage() {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [serverToInvite, setServerToInvite] = useState<ServerResponse | null>(null);

    // Lọc trạng thái ở backend; tìm kiếm và sắp xếp xử lý ở client
    const serverListQuery = useServerList(toServerStatusFilter(statusFilter));
    const statusCountsQuery = useServerStatusCounts();
    const servers: ServerResponse[] | undefined = serverListQuery.data;

    const retryLoadServers = (): void => {
        void serverListQuery.refetch();
        void statusCountsQuery.refetch();
    };

    // Mỗi khi thay đổi bộ lọc thì quay về trang 1
    function withPageReset<T>(setter: (value: T) => void): (value: T) => void {
        return (value) => {
            setter(value);
            setCurrentPage(1);
        };
    }

    const isFiltering: boolean =
        searchTerm.trim() !== '' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

    const filteredServers = useMemo<ServerResponse[]>(() => {
        if (!servers) return [];

        const query = searchTerm.trim().toLowerCase();
        const result = query
            ? servers.filter((server) => server.name?.toLowerCase().includes(query) ?? false)
            : [...servers];

        const direction = sortBy === 'NEWEST' ? -1 : 1;
        return result.sort((a, b) => direction * (toTimestamp(a.createdAt) - toTimestamp(b.createdAt)));
    }, [servers, searchTerm, sortBy]);

    return (
        <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý server</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin các server cộng đồng trên UIT Connect.</p>
            </div>

            <ServerSummary
                counts={statusCountsQuery.data}
                isLoading={statusCountsQuery.isPending}
                isError={statusCountsQuery.isError}
            />

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-55">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => withPageReset(setSearchTerm)(e.target.value)}
                            placeholder="Tìm kiếm theo tên server..."
                            aria-label="Tìm kiếm server"
                            className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                aria-label="Xóa từ khóa"
                                onClick={() => withPageReset(setSearchTerm)('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelect
                            label="Lọc theo trạng thái"
                            value={statusFilter}
                            options={STATUS_OPTIONS}
                            onChange={withPageReset(setStatusFilter)}
                        />
                        <FilterSelect
                            label="Lọc theo lĩnh vực"
                            value={categoryFilter}
                            options={CATEGORY_OPTIONS}
                            onChange={withPageReset(setCategoryFilter)}
                        />
                        <FilterSelect
                            label="Sắp xếp"
                            value={sortBy}
                            options={SORT_OPTIONS}
                            onChange={withPageReset(setSortBy)}
                        />

                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm server
                        </button>
                    </div>
                </div>
            </div>

            {serverListQuery.isError ? (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-500">Đã xảy ra lỗi khi tải danh sách server.</p>
                    <button
                        type="button"
                        onClick={retryLoadServers}
                        disabled={serverListQuery.isFetching}
                        className="mt-3 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {serverListQuery.isFetching ? 'Đang thử lại...' : 'Thử lại'}
                    </button>
                </div>
            ) : (
                <ServerTableList
                    servers={filteredServers}
                    isLoading={serverListQuery.isPending}
                    isFiltering={isFiltering}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onInviteMembers={setServerToInvite}
                />
            )}

            <CreateServerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <ServerInviteModal server={serverToInvite} onClose={() => setServerToInvite(null)} />
        </div>
    );
}
