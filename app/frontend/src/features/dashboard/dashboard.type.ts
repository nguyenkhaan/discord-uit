import type { LucideIcon } from 'lucide-react';

/** Một đoạn chữ, có thể in đậm. Dùng để ghép các câu như: "**Nguyễn Minh** đã gửi tin nhắn..." */
export type RichText = Array<{ text: string; bold?: boolean }>;

/** Bảng màu cho các ô icon nhỏ */
export type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';

export type ServerStatus = 'calling' | 'active';

export interface ServerSummary {
    id: string;
    name: string;
    memberCount: number;
    status: ServerStatus;
    icon: LucideIcon;
    /** Màu nền + màu icon của ô vuông bên trái */
    iconClassName: string;
    imageUrl?: string;
}

export interface QuickLink {
    id: string;
    title: string;
    description: string;
    to: string;
    icon: LucideIcon;
    tone: Tone;
}

export interface NotificationItem {
    id: string;
    message: RichText;
    time: string;
    icon: LucideIcon;
    tone: Tone;
    to: string;
}

export interface ActivityItem {
    id: string;
    /** Không có actor nghĩa là thông báo của hệ thống */
    actor?: { name: string; avatarUrl?: string };
    message: RichText;
    time: string;
    unread?: boolean;
}

export interface SuggestedDocument {
    id: string;
    title: string;
    author: string;
    tags: string[];
    downloads: number;
    likes: number;
    thumbnailUrl?: string;
}