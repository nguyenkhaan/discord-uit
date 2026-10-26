import { ResetPasswordForm } from '../components/ResetPasswordForm';
// Sử dụng router hook (VD: react-router-dom) để lấy token từ URL parameters

export default function ResetPasswordPage() {
    // Giả lập lấy token từ url: const searchParams = new URLSearchParams(window.location.search); const token = searchParams.get('token') || '';
    const token = 'dummy-token';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <ResetPasswordForm token={token} />
        </div>
    );
}
