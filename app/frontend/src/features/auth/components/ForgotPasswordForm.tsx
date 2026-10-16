// src/features/auth/components/ForgotPasswordForm.tsx
import { useState } from 'react';
import { useForgotPasswordMutation } from '../auth.hooks';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AuthHeader } from './AuthHeader';
import { Link } from 'react-router-dom';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword(
      { email },
      {
        onSuccess: () => setIsSuccess(true),
        onError: () => setIsSuccess(true), // Bảo mật: Ẩn lỗi nếu email không tồn tại
      }
    );
  };

  const KeyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <AuthHeader />
        <h2 className="text-xl font-bold text-gray-900">Kiểm tra email của bạn</h2>
        <p className="text-sm text-gray-600">
          Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được một liên kết để khôi phục mật khẩu.
        </p>
        {/* SỬA LỖI HÌNH 2: Đổi variant thành secondary */}
        <Button variant="secondary" className="w-full" onClick={() => setIsSuccess(false)}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <AuthHeader title="Quên mật khẩu?" icon={KeyIcon} />
      <p className="text-sm text-center text-gray-600">
        Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm0 1.058V5a.997.997 0 00.293.707l6 6a1 1 0 001.414 0l6-6A.997.997 0 0017 5v.058l-7 7-7-7z" />
                </svg>
             </div>
             <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: 24520584@gm.uit.edu.vn"
                className="w-full pl-10"
                disabled={isPending}
              />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </Button>

        <div className="text-center">
          <Link to={'/login'}>
            <button type="button" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              &larr; Quay lại Đăng nhập
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
};