import { useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useSendNotificationMutation } from '@/features/notification/notification.hooks';

export const AdminNotificationForm = () => {
    const [recipientUserId, setRecipientUserId] = useState('');
    const [content, setContent] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        isError,
        isPending,
        mutate: sendNotification,
    } = useSendNotificationMutation();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!recipientUserId.trim() || !content.trim()) return;
        setIsSuccess(false);

        sendNotification(
            {
                recipientUserId: recipientUserId.trim(),
                content: content.trim(),
            },
            {
                onSuccess: () => {
                    setIsSuccess(true);
                    setRecipientUserId('');
                    setContent('');
                },
            }
        );
    };

    const MegaphoneIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
            />
        </svg>
    );

    return (
        <div className="flex items-center justify-center p-4 mt-10">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        {MegaphoneIcon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Gửi thông báo
                    </h2>
                    <p className="text-sm text-center text-gray-500">
                        Phát thông báo hệ thống đến người dùng
                    </p>
                </div>

                {isSuccess && (
                    <div
                        className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 text-center"
                        role="status"
                    >
                        Đã gửi thông báo thành công!
                    </div>
                )}

                {isError && (
                    <div
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-800"
                        role="alert"
                    >
                        Không thể gửi thông báo. Hãy kiểm tra ID người nhận và
                        quyền quản trị rồi thử lại.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="recipient-user-id"
                            className="block text-sm font-medium text-gray-700"
                        >
                            ID người nhận{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="recipient-user-id"
                            type="text"
                            required
                            value={recipientUserId}
                            onChange={(event) =>
                                setRecipientUserId(event.target.value)
                            }
                            placeholder="UUID của người nhận"
                            className="w-full bg-gray-50 focus:bg-white transition-colors"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="content"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Nội dung chi tiết{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="content"
                            required
                            maxLength={255}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="Nhập nội dung cần gửi..."
                            className="w-full min-h-[120px] p-3 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                            disabled={isPending}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                        >
                            {isPending ? 'Đang gửi...' : 'Gửi Thông Báo'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
