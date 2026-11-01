import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';

const allowRoutings = ['/login', '/register'];

export function AuthGuardLayout() {
    const location = useLocation();
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return (
            <div className="grid min-h-svh place-items-center bg-page text-muted">
                Đang tải...
            </div>
        );
    }

    if (user && allowRoutings.includes(location.pathname)) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}
