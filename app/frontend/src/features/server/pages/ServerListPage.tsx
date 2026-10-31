import { useState, useMemo } from 'react';
import { useGetServers } from '../server.hooks';
import { ServerSummary } from '../components/ServerSummary';
import { ServerTableList } from '../components/ServerTableList';
import { CreateServerModal } from '../components/CreateServerModal'; 

export default function ServerListPage() {
    const { data: servers, isLoading, isError } = useGetServers();
    
    // States cho bộ lọc & Modal
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Đã kích hoạt state Modal

    // Xử lý logic Filter & Sort
    const filteredServers = useMemo(() => {
        if (!servers) return [];
        let result = [...servers];

        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(s => s.name?.toLowerCase().includes(lowerQuery));
        }

        if (sortBy === 'NEWEST') {
            result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else if (sortBy === 'OLDEST') {
            result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        }

        return result;
    }, [servers, searchTerm, statusFilter, categoryFilter, sortBy]);

    return (
        <div className="p-6 bg-gray-50/50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý server</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin các server cộng đồng trên UIT Connect.</p>
            </div>

            <ServerSummary />

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm server, chủ server, mô tả..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">Trạng thái: Tất cả</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                        </select>
                        <select 
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">Lĩnh vực: Tất cả</option>
                            <option value="EDU">Học tập</option>
                        </select>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="NEWEST">Sắp xếp: Mới nhất</option>
                            <option value="OLDEST">Sắp xếp: Cũ nhất</option>
                        </select>
                        
                        {/* Đã kích hoạt sự kiện onClick để mở Modal */}
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Thêm server
                        </button>
                    </div>
                </div>
            </div>

            {isError ? (
                <div className="p-8 text-center text-red-500 bg-white rounded-xl shadow-sm border border-red-100">
                    Đã xảy ra lỗi khi tải danh sách server. Vui lòng thử lại.
                </div>
            ) : (
                <ServerTableList servers={filteredServers} isLoading={isLoading} />
            )}

            {/* Đã kích hoạt component Modal */}
            <CreateServerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}