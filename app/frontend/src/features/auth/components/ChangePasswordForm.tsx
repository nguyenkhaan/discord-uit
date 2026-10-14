// src/features/auth/components/ChangePasswordForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChangePasswordMutation, useLogoutMutation } from '../auth.hooks';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AuthHeader } from './AuthHeader';
import { cn } from '@/lib/utils';

export const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { mutate: changePassword, isPending: isChanging } = useChangePasswordMutation();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const isPending = isChanging || isLoggingOut;
  const isLengthValid = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          logout(undefined, {
            onSettled: () => {
              setIsSuccess(true);
            }
          });
        },
        onError: () => setIsSuccess(true),
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
      <div className="space-y-6 text-center w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <AuthHeader />
        <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu thành công</h2>
        <p className="text-sm text-gray-600">
           Phiên đăng nhập hiện tại đã kết thúc để đảm bảo an toàn. Vui lòng đăng nhập lại bằng mật khẩu mới của bạn.
        </p>
        <Button 
           className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
           onClick={() => navigate('/login')}
        >
            Đăng nhập lại
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <AuthHeader title="Đổi mật khẩu" icon={KeyIcon} />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Mật khẩu hiện tại */}
        <div className="space-y-2">
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
            Mật khẩu hiện tại <span className="text-red-500">*</span>
          </label>
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                 </svg>
              </div>
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full pl-10 pr-10"
                disabled={isPending}
              />
              <button 
                  type="button" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              </button>
          </div>
        </div>

        {/* Mật khẩu mới */}
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
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-10 pr-10"
                disabled={isPending}
              />
              <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
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
                type={showNewPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-10 pr-10"
                disabled={isPending}
              />
          </div>
        </div>

        {/* Password Criteria */}
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

        <div className="flex gap-4 pt-2">
           <Button type="button" variant="secondary" className="w-full" onClick={() => navigate(-1)}>
              Hủy
           </Button>
           <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending || !isLengthValid || !hasNumber || !hasSpecialChar || newPassword !== confirmPassword}>
             {isPending ? 'Đang xử lý...' : 'Lưu thay đổi'}
           </Button>
        </div>
      </form>
    </div>
  );
};