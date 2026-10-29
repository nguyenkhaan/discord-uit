// Dữ liệu giả để dựng UI. Khi có API, thay bằng dữ liệu từ dashboard.service.ts / dashboard.hooks.ts
import {
    CloudUpload,
    Code,
    Database,
    FileText,
    FileX,
    MessageSquareText,
    UserPlus,
    Users,
} from 'lucide-react';

import type {
    ActivityItem,
    NotificationItem,
    QuickLink,
    ServerSummary,
    SuggestedDocument,
} from './dashboard.type';

export const myServers: ServerSummary[] = [
    {
        id: 'nt208',
        name: 'Nhóm đồ án NT208',
        memberCount: 28,
        status: 'calling',
        icon: Users,
        iconClassName: 'bg-emerald-600 text-white',
    },
    {
        id: 'clb-lap-trinh',
        name: 'CLB Lập trình',
        memberCount: 156,
        status: 'active',
        icon: Code,
        iconClassName: 'bg-blue-600 text-white',
    },
    {
        id: 'on-thi-csdl',
        name: 'Ôn thi CSDL',
        memberCount: 64,
        status: 'active',
        icon: Database,
        iconClassName: 'bg-slate-800 text-white',
    },
];

export const quickLinks: QuickLink[] = [
    {
        id: 'featured',
        title: 'Bài nổi bật',
        description: 'Kinh nghiệm phỏng vấn thực tập',
        to: '/forum',
        icon: FileText,
        tone: 'blue',
    },
    {
        id: 'new-docs',
        title: 'Tài liệu mới',
        description: 'Đề cương ôn tập CSDL',
        to: '/documents',
        icon: FileText,
        tone: 'green',
    },
    {
        id: 'discussing',
        title: 'Đang bàn luận',
        description: 'Hỏi về môn Cấu trúc dữ liệu',
        to: '/forum',
        icon: MessageSquareText,
        tone: 'orange',
    },
    {
        id: 'my-docs',
        title: 'Tài liệu của tôi',
        description: '1 tài liệu chờ duyệt',
        to: '/documents',
        icon: CloudUpload,
        tone: 'purple',
    },
];

export const notifications: NotificationItem[] = [
    {
        id: 'n1',
        icon: UserPlus,
        tone: 'blue',
        to: '/notifications',
        time: '10 phút trước',
        message: [
            { text: 'Bạn nhận được lời mời tham gia server ' },
            { text: '“Nhóm đồ án NT208”', bold: true },
            { text: ' từ Trần Phương' },
        ],
    },
    {
        id: 'n2',
        icon: FileX,
        tone: 'red',
        to: '/notifications',
        time: '2 giờ trước',
        message: [
            { text: 'Tài liệu ' },
            { text: '“Slide Mạng”', bold: true },
            { text: ' bị từ chối. Lý do: nội dung trùng lặp' },
        ],
    },
    {
        id: 'n3',
        icon: MessageSquareText,
        tone: 'teal',
        to: '/notifications',
        time: '5 giờ trước',
        message: [
            { text: 'Bài viết ' },
            { text: '“Kinh nghiệm thực tập”', bold: true },
            { text: ' đã được duyệt' },
        ],
    },
];

export const recentActivities: ActivityItem[] = [
    {
        id: 'a1',
        actor: { name: 'Nguyễn Minh' },
        time: '15 phút trước',
        unread: true,
        message: [
            { text: 'Nguyễn Minh', bold: true },
            { text: ' đã gửi tin nhắn trong server “Nhóm đồ án NT208”' },
        ],
    },
    {
        id: 'a2',
        actor: { name: 'Trần Phương' },
        time: '1 giờ trước',
        message: [
            { text: 'Trần Phương', bold: true },
            { text: ' đã bình luận bài viết Cách ôn thi CSDL hiệu quả' },
        ],
    },
    {
        id: 'a3',
        actor: { name: 'Lê Đức' },
        time: '3 giờ trước',
        message: [
            { text: 'Lê Đức', bold: true },
            { text: ' đã chia sẻ tài liệu Đề cương CSDL' },
        ],
    },
    {
        id: 'a4',
        time: '1 ngày trước',
        message: [
            { text: 'Hệ thống đã gửi thông báo: ' },
            { text: 'Tài liệu của bạn đang được duyệt', bold: true },
        ],
    },
];

export const suggestedDocuments: SuggestedDocument[] = [
    {
        id: 'd1',
        title: 'Đề cương CSDL',
        author: 'Nguyễn Văn A',
        tags: ['CSDL', 'Tài liệu học tập'],
        downloads: 1200,
        likes: 34,
    },
    {
        id: 'd2',
        title: 'Slide Mạng máy tính',
        author: 'Trần Thị B',
        tags: ['Mạng máy tính', 'Bài giảng'],
        downloads: 856,
        likes: 21,
    },
    {
        id: 'd3',
        title: 'Kinh nghiệm thực tập tại doanh nghiệp',
        author: 'Lê Minh',
        tags: ['Kinh nghiệm', 'Hướng nghiệp'],
        downloads: 2100,
        likes: 65,
    },
];