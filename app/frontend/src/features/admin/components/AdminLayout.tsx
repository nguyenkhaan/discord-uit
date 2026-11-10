import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';

export function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

    return (
        <div className="min-h-screen overflow-x-hidden bg-page">
            <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="min-h-screen lg:pl-64">
                <AdminHeader
                    isMenuOpen={isSidebarOpen}
                    onMenuClick={openSidebar}
                />
                <main
                    className="mx-auto w-full max-w-[1600px] px-4 pt-2 pb-10 sm:px-6"
                    id="admin-content"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
