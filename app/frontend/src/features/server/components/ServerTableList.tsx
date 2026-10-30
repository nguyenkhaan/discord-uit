import React, { useState } from 'react';
import type { ServerResponse } from '../server.service';

interface ServerTableListProps {
    servers: ServerResponse[];
    isLoading: boolean;
}

// Bắt buộc phải là "export const ServerTableList" để file khác có thể import được
export const ServerTableList: React.FC<ServerTableListProps> = ({ servers, isLoading }) => {
    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    if (isLoading) return <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Đang tải dữ liệu...</div>;
    
    // Nếu API trả về mảng rỗng, dùng dữ liệu giả lập (Mock) theo đúng UI phác thảo
    const dataSource = servers && servers.length > 0 ? servers : [
        { id: '1', name: 'Software Engineering Lab', createdAt: '2026-10-30T00:00:00Z', memberCount: 42 },
        { id: '2', name: 'Cloud Study Group', createdAt: '2026-10-28T00:00:00Z', memberCount: 15 },
    ];

    // Tính toán phân trang
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentDisplayServers = dataSource.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center"><input type="checkbox" className="rounded text-blue-600" /></th>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3 min-w-[200px]">Thông tin server</th>
                            <th className="px-4 py-3">Chủ server</th>
                            <th className="px-4 py-3 text-center">Lĩnh vực</th>
                            <th className="px-4 py-3 text-center">Thành viên</th>
                            <th className="px-4 py-3">Ngày tạo ↓</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentDisplayServers.map((server, idx) => (
                            <tr key={server.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-4 py-3 text-center"><input type="checkbox" className="rounded text-blue-600" /></td>
                                <td className="px-4 py-3 text-center text-gray-400">{startIndex + idx + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                                            {server.name ? server.name.charAt(0) : 'S'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 line-clamp-1">{server.name || 'Tên Server'}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1">Mô tả server đang cập nhật...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                        <span className="text-gray-700">Nguyễn Văn A</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center"><span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">Học tập</span></td>
                                <td className="px-4 py-3 text-center text-gray-600 font-medium">👥 {server.memberCount || 0}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {server.createdAt ? new Date(server.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                        Hoạt động
                                    </span>
                                </td>
                                {/* CỘT THAO TÁC MỚI */}
<td className="px-4 py-3 text-right relative">
    <button 
        onClick={() => setOpenDropdownId(openDropdownId === server.id ? null : server.id || null)}
        className="text-gray-400 hover:text-gray-700 px-2 py-1"
    >
        ⋮
    </button>

    {/* DROPDOWN MENU */}
    {openDropdownId === server.id && (
        <div className="absolute right-8 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden text-left animate-in fade-in zoom-in duration-100">
            <button className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Xem chi tiết
            </button>
            <button className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                Chỉnh sửa
            </button>
            <hr className="border-gray-100 my-1" />
            <button className="w-full px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Tạm ngừng
            </button>
            <button className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Khóa server
            </button>
            <button className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Xóa server
            </button>
        </div>
    )}
</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Phân trang (Pagination) có thể click */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
                <span>Hiển thị {dataSource.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, dataSource.length)} của {dataSource.length} server</span>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        &lt;
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button 
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded font-medium ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                        >
                            {page}
                        </button>
                    ))}

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};