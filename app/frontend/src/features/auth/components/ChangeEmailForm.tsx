import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChangeEmailMutation, useLogoutMutation } from '../auth.hooks';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AuthHeader } from './AuthHeader';

export const ChangeEmailForm = () => {
    const navigate = useNavigate();

    const [currentEmail, setCurrentEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { mutate: changeEmail, isPending: isChanging } =
        useChangeEmailMutation();
    const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

    const isPending = isChanging || isLoggingOut;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        changeEmail(
            { newEmail, currentPassword },
            {
                onSuccess: () => {
                    logout(undefined, {
                        onSettled: () => {
                            setIsSuccess(true);
                        },
                    });
                },
                onError: () => setIsSuccess(true),
            }
        );
    };

    const AtIcon = (
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
                d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
            />
        </svg>
    );

    if (isSuccess) {
        return (
            <div className="space-y-6 text-center w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <AuthHeader />
                <h2 className="text-xl font-bold text-gray-900">
                    Xác thực Email mới
                </h2>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm text-left space-y-2">
                    <p>
                        1. Chúng tôi đã gửi một liên kết xác thực đến{' '}
                        <strong>{newEmail}</strong>.
                    </p>
                    <p>
                        2. Phiên đăng nhập hiện tại đã tự động kết thúc để bảo
                        vệ tài khoản.
                    </p>
                    <p>
                        3. Vui lòng kiểm tra hộp thư đến, nhấn vào liên kết xác
                        thực để hoàn tất quá trình cập nhật Email.
                    </p>
                </div>
                <Link to={'/login'}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                        Đi đến trang Đăng nhập
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <AuthHeader title="cập nhật Email" icon={AtIcon} />
            <p className="text-sm text-center text-gray-600">
                Cập nhật địa chỉ email của tài khoản
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Email hiện tại
                    </label>
                    <Input
                        type="email"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        placeholder="Nhập email hiện tại..."
                        className="w-full"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="new-email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm0 1.058V5a.997.997 0 00.293.707l6 6a1 1 0 001.414 0l6-6A.997.997 0 0017 5v.058l-7 7-7-7z" />
                            </svg>
                        </div>
                        <Input
                            id="new-email"
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Nhập địa chỉ email mới..."
                            className="w-full pl-10"
                            disabled={isPending}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="current-password"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Mật khẩu xác nhận{' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <Input
                            id="current-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="w-full pl-10 pr-10"
                            disabled={isPending}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path
                                    fillRule="evenodd"
                                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Cần xác nhận mật khẩu vì lý do bảo mật.
                    </p>
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => navigate(-1)}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={
                            isPending ||
                            !newEmail ||
                            !currentPassword ||
                            !currentEmail
                        }
                    >
                        {isPending ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
