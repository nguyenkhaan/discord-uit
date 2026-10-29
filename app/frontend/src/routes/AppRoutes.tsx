import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import ChangeEmailPage from '@/features/auth/pages/ChangeEmailPage';
import HomePage from '@/features/dashboard/pages/HomePage';
import NotFound from '@/pages/NotFound';
import ComingSoonPage from '@/pages/ComingSoonPage';
import TestMainLayout from '@/pages/TestMainLayout';

import AuthGuard from '@/components/AuthGuard';
import { Header } from '@/components/Header/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminNotificationForm } from '@/features/admin/AdminNotificationForm';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* ===== Các trang KHÔNG có Sidebar/Header ===== */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ===== Các trang NẰM TRONG MainLayout =====
                    Route cha không có path, chỉ có element là layout.
                    Mỗi route con sẽ được render vào chỗ <Outlet /> trong MainLayout.
                    Khi bấm NavLink trên Sidebar, chỉ phần <Outlet /> đổi, Sidebar/Header giữ nguyên. */}
                <Route
                    element={
                        <AuthGuard>
                            <MainLayout />
                        </AuthGuard>
                    }
                >
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/servers" element={<ComingSoonPage title="Server" />} />
                    <Route path="/documents" element={<ComingSoonPage title="Tài liệu" />} />
                    <Route path="/forum" element={<ComingSoonPage title="Diễn đàn" />} />
                    <Route path="/notifications" element={<ComingSoonPage title="Thông báo" />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/change-email" element={<ChangeEmailPage />} />
                </Route>

                {/* ===== Trang test / admin (giữ như cũ) ===== */}
                <Route path="/test-header" element={<Header />} />
                <Route
                    path="/admin/notifications"
                    element={
                        <MainLayout>
                            <AdminNotificationForm />
                        </MainLayout>
                    }
                />
                <Route path="/test-main-layout" element={<TestMainLayout />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}