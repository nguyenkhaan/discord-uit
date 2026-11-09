import type { LucideIcon } from 'lucide-react';

/** Bảng màu ngữ nghĩa dùng chung cho badge, icon thống kê và avatar trong khu vực admin */
export type AdminTone =
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'violet'
    | 'neutral';

export interface AdminStatTrend {
    /** Ví dụ: "+12%" */
    value: string;
    direction: 'up' | 'down';
    /** Xu hướng tốt (xanh) hay xấu (đỏ) đối với admin */
    isPositive: boolean;
}

export interface AdminStat {
    key: string;
    title: string;
    value: number;
    icon: LucideIcon;
    tone: AdminTone;
    trend: AdminStatTrend;
}

export interface AdminSelectOption<T extends string> {
    readonly value: T;
    readonly label: string;
}

export interface AdminPerson {
    name: string;
    roleLabel: string;
}

/* ===== Báo cáo vi phạm ===== */

export type ReportTargetType =
    | 'DOCUMENT'
    | 'POST'
    | 'COMMENT'
    | 'IMAGE'
    | 'SERVER';

export type ViolationType =
    | 'COPYRIGHT'
    | 'SPAM'
    | 'OFFENSIVE_LANGUAGE'
    | 'ADVERTISING'
    | 'INAPPROPRIATE'
    | 'MALWARE'
    | 'DUPLICATE';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface AdminReport {
    id: string;
    targetType: ReportTargetType;
    title: string;
    description: string;
    violationType: ViolationType;
    reporter: AdminPerson;
    violator: AdminPerson;
    createdAt: string;
    status: ReportStatus;
}

/* ===== Người dùng ===== */

export type AdminUserRole = 'STUDENT' | 'LECTURER' | 'ADMIN';

export type AdminUserStatus = 'ACTIVE' | 'WARNED' | 'BANNED';

export interface AdminUser {
    id: string;
    fullName: string;
    studentCode: string;
    email: string;
    role: AdminUserRole;
    joinedAt: string;
    status: AdminUserStatus;
}

/* ===== Server ===== */

export type AdminServerCategory =
    | 'EDUCATION'
    | 'CREATIVE'
    | 'LANGUAGE'
    | 'ENTERTAINMENT'
    | 'LIFESTYLE'
    | 'BUSINESS'
    | 'HOBBY';

export type AdminServerStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface AdminServer {
    id: string;
    name: string;
    description: string;
    ownerName: string;
    category: AdminServerCategory;
    memberCount: number;
    createdAt: string;
    status: AdminServerStatus;
}
