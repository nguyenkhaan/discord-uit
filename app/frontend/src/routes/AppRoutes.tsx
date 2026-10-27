import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';

import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import ChangeEmailPage from '@/features/auth/pages/ChangeEmailPage';
import NotFound from '@/pages/NotFound';

import AuthGuard from '@/components/AuthGuard';
import { Header } from '@/components/Header/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminNotificationForm } from '@/features/admin/AdminNotificationForm';
import TestMainLayout from '@/pages/TestMainLayout';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                    path="/change-password"
                    element={
                        <AuthGuard>
                            <ChangePasswordPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path="/change-email"
                    element={
                        <AuthGuard>
                            <ChangeEmailPage />
                        </AuthGuard>
                    }
                />

                <Route path="/test-header" element={<Header />} />
                <Route
                    path="/admin/notifications"
                    element={
                        <MainLayout>
                            <AdminNotificationForm />
                        </MainLayout>
                    }
                />
                {/* Seeing the main layout structure (testing only) */}
                <Route 
                    path="/test-main-layout"
                    element={
                        <TestMainLayout />
                    }
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
