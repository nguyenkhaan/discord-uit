import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';

/** Chỉ cho ADMIN vào khu vực quản trị; backend vẫn kiểm tra quyền ở từng API */
export function AdminGuard({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    if (user?.systemRole !== 'ADMIN') {
        return <Navigate replace to="/home" />;
    }

    return <>{children}</>;
}
