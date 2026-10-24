import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';

import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import ChangeEmailPage from '@/features/auth/pages/ChangeEmailPage';
import NotFound from '@/pages/NotFound';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/change-email" element={<ChangeEmailPage />} />
                <Route path="/not-found" element={<NotFound />} />
                
                <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
        </BrowserRouter>
    );
}