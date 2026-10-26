import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface AuthGuardProps {
    children?: React.ReactNode;
}

const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const location = useLocation();
    const accessToken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');

    if (!accessToken || !refreshToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
