import React from 'react';

interface ServerFilterBarProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    // Thêm các prop cho filter status, category...
}

export const ServerFilterBar: React.FC<ServerFilterBarProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex justify-between items-center">
            {/* Input Search */}
            <div className="relative w-1/3">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm server, tên, mô tả..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
            </div>
            {/* Các dropdown filter (Trạng thái, Lĩnh vực, Sắp xếp) và Nút "Thêm Server" */}
        </div>
    );
};