// src/features/auth/components/ResetPasswordForm.tsx
import { useState } from 'react';
import { useResetPasswordMutation } from '../auth.hooks';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AuthHeader } from './AuthHeader';
import { cn } from '@/lib/utils';

export const ResetPasswordForm = ({ token }: { token: string }) => {
  // SỬA LỖI HÌNH 1: Đổi tên state thành newPassword cho khớp với schema
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { mutate: resetPassword, isPending } = useResetPasswordMutation();

  const isLengthValid = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    
    // Truyền newPassword thay vì password
    resetPassword(
      { newPassword, token }, // confirmPassword thường không cần gửi lên backend nếu chỉ để validate ở client, tuỳ thuộc vào schema của bạn. Nếu schema yêu cầu, hãy thêm vào.
      {
        onSuccess: () => setIsSuccess(true),
        onError: () => setIsSuccess(true), // Bảo mật
      }
    );
  };

  const UserIcon = (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
     </svg>
  );

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <AuthHeader />
        <h2 className="text-xl font-bold text-gray-900">Yêu cầu đã được xử lý</h2>
        <p className="text-sm text-gray-600">
           Nếu liên kết hợp lệ, mật khẩu của bạn đã được thay đổi.
        </p>
        {/* SỬA LỖI HÌNH 2: Button mặc định thường là primary, không cần định nghĩa lại nếu thiếu class */}
        <Button className="w-full">
          Quay lại Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <AuthHeader title="Đặt lại mật khẩu" icon={UserIcon} />
      <p className="text-sm text-center text-gray-600">
        Mật khẩu mới của bạn phải khác với các mật khẩu trước đây để đảm bảo an toàn.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                 </svg>
              </div>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-10 pr-10"
                disabled={isPending}
              />
              <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
          </label>
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                 </svg>
              </div>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-10 pr-10"
                disabled={isPending}
              />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div className={cn("flex items-center space-x-2", isLengthValid ? "text-green-600" : "text-gray-500")}>
             <span>{isLengthValid ? '✓' : '•'}</span>
             <span>Tối thiểu 8 ký tự</span>
          </div>
          <div className={cn("flex items-center space-x-2", hasNumber ? "text-green-600" : "text-gray-500")}>
             <span>{hasNumber ? '✓' : '•'}</span>
             <span>Chứa ít nhất 1 chữ số</span>
          </div>
          <div className={cn("flex items-center space-x-2", hasSpecialChar ? "text-green-600" : "text-gray-500")}>
             <span>{hasSpecialChar ? '✓' : '•'}</span>
             <span>Chứa ít nhất 1 ký tự đặc biệt (@#$...)</span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isPending || !isLengthValid || !hasNumber || !hasSpecialChar || newPassword !== confirmPassword}>
          Xác nhận đổi mật khẩu
        </Button>
         <div className="text-center">
          <button type="button" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            &larr; Quay lại Đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
};