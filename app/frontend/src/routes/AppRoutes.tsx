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
import ServerListPage from '@/features/server/pages/ServerListPage';
import InviteJoinPage from '@/features/server/pages/InviteJoinPage';
import ServerDetailPage from '@/features/server/pages/ServerDetailPage';
import AuthGuard from '@/components/AuthGuard';
import { Header } from '@/components/Header/Header';
import { AuthGuardLayout } from '@/components/layout/AuthGuardLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminNotificationForm } from '@/features/admin/components/AdminNotificationForm';
import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import AdminAccountsPage from '@/features/admin/pages/AdminAccountsPage';
import AdminReportsPage from '@/features/admin/pages/AdminReportsPage';
import AdminServersPage from '@/features/admin/pages/AdminServersPage';
import AdminComingSoonPage from '@/pages/AdminComingSoonPage';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AuthGuardLayout />}>
                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />

                    {/* ===== Các trang KHÔNG có Sidebar/Header ===== */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path="/reset-password"
                        element={<ResetPasswordPage />}
                    />

                    {/* Trang tham gia server bằng link mời: cần đăng nhập nhưng không dùng MainLayout */}
                    <Route
                        path="/invite/:token"
                        element={
                            <AuthGuard>
                                <InviteJoinPage />
                            </AuthGuard>
                        }
                    />

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
                        <Route path="/servers" element={<ServerListPage />} />
                        
                        <Route
                            path="/servers/:serverId"
                            element={<ServerDetailPage />}
                        />
                        <Route
                            path="/documents"
                            element={<ComingSoonPage title="Tài liệu" />}
                        />
                        <Route
                            path="/forum"
                            element={<ComingSoonPage title="Diễn đàn" />}
                        />
                        <Route
                            path="/notifications"
                            element={<ComingSoonPage title="Thông báo" />}
                        />
                        <Route
                            path="/change-password"
                            element={<ChangePasswordPage />}
                        />
                        <Route
                            path="/change-email"
                            element={<ChangeEmailPage />}
                        />
                    </Route>

                    {/* ===== Trang test ===== */}
                    <Route path="/test-header" element={<Header />} />

                    {/* ===== Khu vực quản trị: chỉ ADMIN, dùng AdminLayout riêng ===== */}
                    <Route
                        path="/admin"
                        element={
                            <AuthGuard>
                                <AdminGuard>
                                    <AdminLayout />
                                </AdminGuard>
                            </AuthGuard>
                        }
                    >
                        <Route
                            index
                            element={<AdminComingSoonPage title="Tổng quan" />}
                        />
                        <Route
                            path="accounts"
                            element={<AdminAccountsPage />}
                        />
                        <Route path="servers" element={<AdminServersPage />} />
                        <Route
                            path="documents"
                            element={
                                <AdminComingSoonPage title="Quản lý tài liệu" />
                            }
                        />
                        <Route
                            path="forum"
                            element={
                                <AdminComingSoonPage title="Quản lý diễn đàn" />
                            }
                        />
                        <Route path="reports" element={<AdminReportsPage />} />
                        <Route
                            path="notifications"
                            element={<AdminNotificationForm />}
                        />
                        <Route
                            path="settings"
                            element={<AdminComingSoonPage title="Cài đặt" />}
                        />
                    </Route>

                    <Route
                        path="/test-main-layout"
                        element={<TestMainLayout />}
                    />

                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
