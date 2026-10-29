import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';

export function AuthGuard({ children }: { children?: ReactNode }) {
    const location = useLocation();
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return (
            <div className="grid min-h-svh place-items-center bg-page text-muted">
                Đang tải...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}

export default AuthGuard;