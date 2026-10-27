import { useCallback, useState, type PropsWithChildren } from 'react';

import { Header } from '@/components/Header/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export function MainLayout({ children }: PropsWithChildren) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

    return (
        <div className="min-h-screen overflow-x-hidden bg-page">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="min-h-screen md:pl-60">
                <Header isMenuOpen={isSidebarOpen} onMenuClick={openSidebar} />
                <main
                    className="min-h-[calc(100vh-4rem)] p-4 sm:p-6"
                    id="main-content"
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
