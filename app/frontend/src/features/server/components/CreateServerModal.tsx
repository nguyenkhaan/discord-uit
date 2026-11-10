import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { useCreateServerMutation } from '@/features/server/server.hooks';
import { showToast } from '@/lib/toast';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MAX_IMAGE_SIZE_MB = 5;

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { mutate: createServer, isPending } = useCreateServerMutation();

    const previewUrlRef = useRef<string | null>(null);

    // Cập nhật ảnh + URL xem trước, thu hồi URL cũ để tránh rò rỉ bộ nhớ
    const updateImage = (file: File | null) => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = file ? URL.createObjectURL(file) : null;
        previewUrlRef.current = url;
        setImageFile(file);
        setPreviewUrl(url);
    };

    // Thu hồi URL xem trước khi component bị gỡ
    useEffect(
        () => () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        },
        []
    );

    const resetForm = () => {
        setName('');
        setDescription('');
        updateImage(null);
    };

    const handleClose = () => {
        if (isPending) return;
        resetForm();
        onClose();
    };

    // Đóng modal bằng phím Esc
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // cho phép chọn lại cùng một file
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn một tệp hình ảnh.');
            return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            showToast(`Ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`);
            return;
        }
        updateImage(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        if (!trimmedName) {
            showToast('Vui lòng nhập tên server.');
            return;
        }

        createServer({
            name: trimmedName,
            description: trimmedDescription || undefined,
            image: imageFile,
        }, {
            onSuccess: () => {
                showToast(`Đã tạo server "${trimmedName}" thành công.`);
                resetForm();
                onClose();
            },
            onError: () => {
                showToast('Không thể tạo server. Vui lòng thử lại.');
            },
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
            onMouseDown={(e) => {
                // Click vào lớp nền (không phải nội dung modal) thì đóng
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-server-title"
                className="relative bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-[500px] m-4 animate-in fade-in zoom-in duration-200"
            >
                <button
                    type="button"
                    aria-label="Đóng"
                    onClick={handleClose}
                    disabled={isPending}
                    className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 id="create-server-title" className="text-xl font-bold text-slate-800 mb-6">
                    Thêm Server Mới
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="server-name" className="block text-sm font-medium text-slate-700 mb-2">
                            Tên Server <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="server-name"
                            type="text"
                            autoFocus
                            maxLength={100}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                            placeholder="Nhập tên server..."
                        />
                    </div>

                    <div>
                        <label htmlFor="server-description" className="block text-sm font-medium text-slate-700 mb-2">
                            Mô tả server <span className="text-slate-400">(Tùy chọn)</span>
                        </label>
                        <textarea
                            id="server-description"
                            rows={3}
                            maxLength={500}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                            aria-describedby="server-description-help"
                            className="w-full resize-y px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                            placeholder="Giới thiệu ngắn về mục đích của server..."
                        />
                        <p id="server-description-help" className="mt-1.5 text-xs text-slate-500">
                            Tối đa 500 ký tự ({description.length}/500)
                        </p>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-slate-700 mb-2">Ảnh đại diện (Tùy chọn)</span>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Xem trước ảnh server" className="w-full h-full object-cover" />
                                ) : (
                                    <ImagePlus className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                                        {imageFile ? 'Đổi ảnh' : 'Chọn ảnh'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            disabled={isPending}
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {imageFile && (
                                        <button
                                            type="button"
                                            onClick={() => updateImage(null)}
                                            disabled={isPending}
                                            className="px-3 py-2 text-sm text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                                        >
                                            Gỡ ảnh
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5 truncate" title={imageFile?.name}>
                                    {imageFile ? imageFile.name : `PNG, JPG, GIF – tối đa ${MAX_IMAGE_SIZE_MB}MB`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isPending}
                            className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !name.trim()}
                            className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20"
                        >
                            {isPending ? 'Đang tạo...' : 'Tạo Server'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
