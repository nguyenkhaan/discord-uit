import React, { useState } from 'react';
import { useCreateServerMutation } from '../server.hooks';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const { mutate: createServer, isPending } = useCreateServerMutation();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const formData = new FormData();
        formData.append('name', name);
        if (imageFile) formData.append('image', imageFile);

        createServer(formData, {
            onSuccess: () => {
                onClose();
                setName('');
                setImageFile(null);
            }
        });
    };

    return (
        // Lớp nền đen mờ bao phủ toàn màn hình (fixed inset-0, bg-black/50)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            {/* Khung Modal màu trắng ở giữa */}
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-[500px] m-4 animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Thêm Server Mới</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Input Tên Server */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tên Server <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
                            placeholder="Nhập tên server..."
                        />
                    </div>

                    {/* Input Tải Ảnh */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ảnh đại diện (Tùy chọn)
                        </label>
                        <div className="flex items-center gap-3">
                            {/* Nút Choose File Custom */}
                            <label className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                                Choose File
                                <input 
                                    type="file" 
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                            <span className="text-sm text-slate-500">
                                {imageFile ? imageFile.name : 'No file chosen'}
                            </span>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex justify-end gap-3 mt-8 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={isPending}
                            className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20"
                        >
                            {isPending ? 'Đang tạo...' : 'Tạo Server'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};