// Dữ liệu giả để dựng UI admin. Khi backend có API, thay bằng dữ liệu từ admin.service.ts / admin.hooks.ts
import {
    Ban,
    CircleCheck,
    CircleX,
    Clock3,
    Flag,
    PauseCircle,
    Server,
    ServerCog,
    ShieldAlert,
    UserCheck,
    UserRound,
    Users,
} from 'lucide-react';

import type {
    AdminReport,
    AdminServer,
    AdminServerCategory,
    AdminServerStatus,
    AdminStat,
    AdminUser,
    AdminUserStatus,
    ReportStatus,
    ReportTargetType,
    ViolationType,
} from '@/features/admin/admin.type';

const STUDENT = 'Sinh viên';

export const reportStats: AdminStat[] = [
    {
        key: 'total',
        title: 'Tổng báo cáo',
        value: 428,
        icon: Flag,
        tone: 'danger',
        trend: { value: '+12%', direction: 'up', isPositive: true },
    },
    {
        key: 'pending',
        title: 'Đang chờ xử lý',
        value: 12,
        icon: Clock3,
        tone: 'warning',
        trend: { value: '+3%', direction: 'up', isPositive: false },
    },
    {
        key: 'resolved',
        title: 'Đã xử lý',
        value: 392,
        icon: CircleCheck,
        tone: 'success',
        trend: { value: '+15%', direction: 'up', isPositive: true },
    },
    {
        key: 'removed',
        title: 'Nội dung bị gỡ/banned',
        value: 137,
        icon: CircleX,
        tone: 'danger',
        trend: { value: '+22%', direction: 'up', isPositive: true },
    },
];

export const userStats: AdminStat[] = [
    {
        key: 'total',
        title: 'Tổng người dùng',
        value: 12548,
        icon: Users,
        tone: 'info',
        trend: { value: '+12%', direction: 'up', isPositive: true },
    },
    {
        key: 'active',
        title: 'Người dùng hoạt động',
        value: 11320,
        icon: UserCheck,
        tone: 'success',
        trend: { value: '+8%', direction: 'up', isPositive: true },
    },
    {
        key: 'warned',
        title: 'Người dùng bị cảnh cáo',
        value: 48,
        icon: UserRound,
        tone: 'warning',
        trend: { value: '+3%', direction: 'up', isPositive: false },
    },
    {
        key: 'banned',
        title: 'Người dùng bị khóa',
        value: 27,
        icon: Ban,
        tone: 'danger',
        trend: { value: '+5%', direction: 'up', isPositive: false },
    },
];

export const serverStats: AdminStat[] = [
    {
        key: 'total',
        title: 'Tổng server',
        value: 1236,
        icon: Server,
        tone: 'info',
        trend: { value: '+8%', direction: 'up', isPositive: true },
    },
    {
        key: 'active',
        title: 'Server đang hoạt động',
        value: 1180,
        icon: ServerCog,
        tone: 'success',
        trend: { value: '+10%', direction: 'up', isPositive: true },
    },
    {
        key: 'suspended',
        title: 'Server tạm ngừng',
        value: 32,
        icon: PauseCircle,
        tone: 'warning',
        trend: { value: '+3%', direction: 'up', isPositive: false },
    },
    {
        key: 'locked',
        title: 'Server bị khóa',
        value: 24,
        icon: ShieldAlert,
        tone: 'danger',
        trend: { value: '+5%', direction: 'up', isPositive: false },
    },
];

/* ===== Báo cáo vi phạm ===== */

const featuredReports: AdminReport[] = [
    {
        id: 'rp-001',
        targetType: 'DOCUMENT',
        title: 'Đề cương ôn tập HK2.pdf',
        description: 'Có nội dung trùng lặp, vi phạm bản quyền.',
        violationType: 'COPYRIGHT',
        reporter: { name: 'NguyenHoangA', roleLabel: STUDENT },
        violator: { name: 'tranminhkhoa', roleLabel: STUDENT },
        createdAt: '2025-06-12T14:35:00+07:00',
        status: 'PENDING',
    },
    {
        id: 'rp-002',
        targetType: 'POST',
        title: 'Xin tài liệu môn ML',
        description: 'Nội dung spam, quảng cáo tài liệu.',
        violationType: 'SPAM',
        reporter: { name: 'lethaonguyen', roleLabel: STUDENT },
        violator: { name: 'anonymouse', roleLabel: STUDENT },
        createdAt: '2025-06-11T20:12:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-003',
        targetType: 'COMMENT',
        title: 'Cảm ơn bạn nhiều!',
        description: 'Có ngôn từ không phù hợp.',
        violationType: 'OFFENSIVE_LANGUAGE',
        reporter: { name: 'phamgiabao', roleLabel: STUDENT },
        violator: { name: 'dothiminhquan', roleLabel: STUDENT },
        createdAt: '2025-06-10T16:20:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-004',
        targetType: 'POST',
        title: 'Tuyển thành viên CLB',
        description: 'Nội dung quảng cáo, không đúng chuyên mục diễn đàn.',
        violationType: 'ADVERTISING',
        reporter: { name: 'vumaianh', roleLabel: STUDENT },
        violator: { name: 'marketing123', roleLabel: STUDENT },
        createdAt: '2025-06-09T10:18:00+07:00',
        status: 'PENDING',
    },
    {
        id: 'rp-005',
        targetType: 'IMAGE',
        title: 'banner_quangcao.png',
        description: 'Chứa nội dung quảng cáo bên ngoài.',
        violationType: 'ADVERTISING',
        reporter: { name: 'hoangducloc', roleLabel: STUDENT },
        violator: { name: 'user0987', roleLabel: STUDENT },
        createdAt: '2025-06-08T22:05:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-006',
        targetType: 'SERVER',
        title: 'Game & Esports',
        description: 'Có nội dung không phù hợp trong kênh chat.',
        violationType: 'INAPPROPRIATE',
        reporter: { name: 'nguyenphuonglinh', roleLabel: STUDENT },
        violator: { name: 'khoailogic', roleLabel: STUDENT },
        createdAt: '2025-06-07T19:40:00+07:00',
        status: 'PENDING',
    },
    {
        id: 'rp-007',
        targetType: 'DOCUMENT',
        title: 'Dataset học máy.rar',
        description: 'Chứa mã độc/malware.',
        violationType: 'MALWARE',
        reporter: { name: 'tranquocdung', roleLabel: 'Giảng viên' },
        violator: { name: 'unknown', roleLabel: 'Không rõ' },
        createdAt: '2025-06-06T13:12:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-008',
        targetType: 'COMMENT',
        title: 'Link tài liệu tại đây: ...',
        description: 'Spam link, không liên quan nội dung.',
        violationType: 'SPAM',
        reporter: { name: 'dangkhacnhi', roleLabel: STUDENT },
        violator: { name: 'spamuser01', roleLabel: STUDENT },
        createdAt: '2025-06-05T17:30:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-009',
        targetType: 'POST',
        title: 'Chia sẻ khóa học lậu',
        description: 'Chia sẻ tài liệu vi phạm bản quyền.',
        violationType: 'COPYRIGHT',
        reporter: { name: 'leminhhai', roleLabel: STUDENT },
        violator: { name: 'piratecontent', roleLabel: STUDENT },
        createdAt: '2025-06-04T09:15:00+07:00',
        status: 'RESOLVED',
    },
    {
        id: 'rp-010',
        targetType: 'DOCUMENT',
        title: 'Slide giải đề HK1.pptx',
        description: 'Nội dung trùng lặp với tài liệu khác.',
        violationType: 'DUPLICATE',
        reporter: { name: 'nguyentranbao', roleLabel: STUDENT },
        violator: { name: 'hoangnam', roleLabel: STUDENT },
        createdAt: '2025-06-03T11:22:00+07:00',
        status: 'PENDING',
    },
];

const extraReportSeeds: Array<
    [ReportTargetType, string, string, ViolationType, ReportStatus]
> = [
    [
        'DOCUMENT',
        'Giáo trình CTDL.pdf',
        'Tải lên lại tài liệu có bản quyền.',
        'COPYRIGHT',
        'RESOLVED',
    ],
    [
        'POST',
        'Bán tài khoản game giá rẻ',
        'Quảng cáo bán hàng trong diễn đàn.',
        'ADVERTISING',
        'DISMISSED',
    ],
    [
        'COMMENT',
        'Ai cần đáp án inbox',
        'Spam bình luận ở nhiều bài viết.',
        'SPAM',
        'RESOLVED',
    ],
    [
        'SERVER',
        'Hội săn deal',
        'Kênh chat chứa nhiều link quảng cáo.',
        'ADVERTISING',
        'PENDING',
    ],
    [
        'IMAGE',
        'meme_lop.jpg',
        'Hình ảnh mang tính xúc phạm.',
        'INAPPROPRIATE',
        'RESOLVED',
    ],
    [
        'DOCUMENT',
        'Tool crack IDE.zip',
        'Tệp nén chứa phần mềm độc hại.',
        'MALWARE',
        'RESOLVED',
    ],
    [
        'POST',
        'Review giảng viên',
        'Có ngôn từ thiếu tôn trọng.',
        'OFFENSIVE_LANGUAGE',
        'DISMISSED',
    ],
    [
        'DOCUMENT',
        'Đề thi CSDL 2024.pdf',
        'Trùng lặp với tài liệu đã được duyệt.',
        'DUPLICATE',
        'RESOLVED',
    ],
];

const extraReporters = [
    'vothanhtam',
    'ngocanh.uit',
    'huynhbaolong',
    'phanthuha',
];
const extraViolators = ['guest2024', 'sale_off', 'quickanswer', 'dealhunter'];

const extraReports: AdminReport[] = Array.from({ length: 22 }, (_, index) => {
    const [targetType, title, description, violationType, status] =
        extraReportSeeds[index % extraReportSeeds.length];
    const day = String(28 - (index % 27)).padStart(2, '0');
    const hour = String(8 + (index % 12)).padStart(2, '0');

    return {
        id: `rp-${String(index + 11).padStart(3, '0')}`,
        targetType,
        title,
        description,
        violationType,
        reporter: {
            name: extraReporters[index % extraReporters.length],
            roleLabel: STUDENT,
        },
        violator: {
            name: extraViolators[index % extraViolators.length],
            roleLabel: STUDENT,
        },
        createdAt: `2025-05-${day}T${hour}:${String((index * 7) % 60).padStart(2, '0')}:00+07:00`,
        status,
    };
});

export const mockReports: AdminReport[] = [...featuredReports, ...extraReports];

/* ===== Người dùng ===== */

const featuredUsers: AdminUser[] = [
    [
        'Nguyễn Hoàng Anh',
        '22520123',
        'nguyenha@gmail.com',
        '2022-09-12',
        'ACTIVE',
    ],
    [
        'Trần Minh Khoa',
        '22520456',
        'khoa.tran@gmail.com',
        '2022-10-03',
        'ACTIVE',
    ],
    [
        'Lê Thảo Nguyên',
        '22520789',
        'thaonguyen@gmail.com',
        '2022-10-15',
        'ACTIVE',
    ],
    ['Phạm Gia Bảo', '22520111', 'giabao@gmail.com', '2022-10-20', 'WARNED'],
    ['Đỗ Minh Quân', '22520333', 'minhquan@gmail.com', '2022-10-28', 'ACTIVE'],
    [
        'Nguyễn Phương Linh',
        '22520678',
        'linhnguyen@gmail.com',
        '2022-11-02',
        'BANNED',
    ],
    [
        'Trần Quốc Dũng',
        '22520901',
        'dung.tran@gmail.com',
        '2022-11-10',
        'ACTIVE',
    ],
    ['Vũ Mai Anh', '22520098', 'maianh@gmail.com', '2022-11-18', 'ACTIVE'],
    ['Hoàng Đức Lộc', '22520376', 'ducloc@gmail.com', '2022-11-25', 'ACTIVE'],
    [
        'Đặng Khánh Chi',
        '22520567',
        'khanhchi@gmail.com',
        '2022-12-01',
        'WARNED',
    ],
].map(
    ([fullName, studentCode, email, joinedAt, status], index): AdminUser => ({
        id: `usr-${String(index + 1).padStart(3, '0')}`,
        fullName,
        studentCode,
        email,
        role: fullName === 'Trần Quốc Dũng' ? 'ADMIN' : 'STUDENT',
        joinedAt: `${joinedAt}T08:00:00+07:00`,
        status: status as AdminUserStatus,
    })
);

const extraUserNames = [
    'Bùi Thanh Tâm',
    'Phan Thu Hà',
    'Võ Ngọc Ánh',
    'Huỳnh Bảo Long',
    'Lâm Gia Huy',
    'Ngô Thị Mỹ',
    'Trịnh Công Sơn',
    'Đinh Quang Vinh',
    'Mai Xuân Trường',
    'Cao Thùy Dương',
    'Tạ Minh Nhật',
    'Lý Hải Yến',
];

const extraUserStatuses: AdminUserStatus[] = [
    'ACTIVE',
    'ACTIVE',
    'ACTIVE',
    'WARNED',
    'ACTIVE',
    'BANNED',
];

const extraUsers: AdminUser[] = Array.from({ length: 26 }, (_, index) => {
    const fullName = extraUserNames[index % extraUserNames.length];
    const code = String(23520000 + index * 37);
    const month = String((index % 12) + 1).padStart(2, '0');
    const day = String((index % 27) + 1).padStart(2, '0');

    return {
        id: `usr-${String(index + 11).padStart(3, '0')}`,
        fullName,
        studentCode: index % 9 === 4 ? 'GV' + String(1000 + index) : code,
        email: `${code}@gm.uit.edu.vn`,
        role: index % 9 === 4 ? 'LECTURER' : 'STUDENT',
        joinedAt: `2023-${month}-${day}T08:00:00+07:00`,
        status: extraUserStatuses[index % extraUserStatuses.length],
    };
});

export const mockUsers: AdminUser[] = [...featuredUsers, ...extraUsers];

/* ===== Server ===== */

const featuredServers: Array<
    [
        string,
        string,
        string,
        AdminServerCategory,
        number,
        string,
        AdminServerStatus,
    ]
> = [
    [
        'Cộng đồng CNTT UIT',
        'Chia sẻ kiến thức về lập trình, công nghệ và cơ hội việc làm.',
        'Nguyễn Hoàng Anh',
        'EDUCATION',
        428,
        '2024-09-12',
        'ACTIVE',
    ],
    [
        'Design & Multimedia',
        'Nơi trao đổi về thiết kế, đồ họa, dựng phim.',
        'Trần Minh Khoa',
        'CREATIVE',
        312,
        '2024-08-03',
        'ACTIVE',
    ],
    [
        'UIT English Club',
        'Cùng học và luyện tập tiếng Anh mỗi tuần.',
        'Lê Thảo Nguyên',
        'LANGUAGE',
        256,
        '2024-07-20',
        'ACTIVE',
    ],
    [
        'Game & Esports',
        'Thảo luận về game, giải đấu, cùng chơi.',
        'Phạm Gia Bảo',
        'ENTERTAINMENT',
        198,
        '2024-06-15',
        'SUSPENDED',
    ],
    [
        'Cộng đồng K24',
        'Nơi giao lưu, kết nối sinh viên khóa 24.',
        'Đỗ Minh Quân',
        'LIFESTYLE',
        176,
        '2024-05-28',
        'ACTIVE',
    ],
    [
        'Kinh tế & Khởi nghiệp',
        'Chia sẻ kiến thức về kinh tế, khởi nghiệp.',
        'Nguyễn Phương Linh',
        'BUSINESS',
        142,
        '2024-04-10',
        'ACTIVE',
    ],
    [
        'Âm nhạc UIT',
        'Chia sẻ và thảo luận về âm nhạc.',
        'Trần Quốc Dũng',
        'HOBBY',
        98,
        '2024-03-22',
        'ACTIVE',
    ],
    [
        'Nhiếp ảnh & Du lịch',
        'Chia sẻ những khoảnh khắc, kinh nghiệm du lịch.',
        'Vũ Mai Anh',
        'HOBBY',
        86,
        '2024-02-15',
        'LOCKED',
    ],
];

const extraServerSeeds: Array<[string, string, AdminServerCategory]> = [
    ['Ôn thi CSDL', 'Cùng nhau ôn thi môn Cơ sở dữ liệu.', 'EDUCATION'],
    ['Nhóm đồ án NT208', 'Trao đổi tiến độ đồ án môn NT208.', 'EDUCATION'],
    ['CLB Tiếng Nhật', 'Học tiếng Nhật từ N5 đến N3.', 'LANGUAGE'],
    ['Board Game UIT', 'Hẹn lịch chơi board game cuối tuần.', 'ENTERTAINMENT'],
    ['Pass đồ KTX', 'Trao đổi, pass lại đồ dùng ký túc xá.', 'LIFESTYLE'],
    ['Startup Weekend', 'Kết nối ý tưởng khởi nghiệp.', 'BUSINESS'],
    ['Vẽ & Minh họa', 'Chia sẻ tranh vẽ, minh họa số.', 'CREATIVE'],
];

const extraServerStatuses: AdminServerStatus[] = [
    'ACTIVE',
    'ACTIVE',
    'ACTIVE',
    'SUSPENDED',
    'ACTIVE',
    'LOCKED',
];

export const mockServers: AdminServer[] = [
    ...featuredServers.map(
        (
            [
                name,
                description,
                ownerName,
                category,
                memberCount,
                createdAt,
                status,
            ],
            index
        ) => ({
            id: `srv-${String(index + 1).padStart(3, '0')}`,
            name,
            description,
            ownerName,
            category,
            memberCount,
            createdAt: `${createdAt}T08:00:00+07:00`,
            status,
        })
    ),
    ...Array.from({ length: 24 }, (_, index): AdminServer => {
        const [name, description, category] =
            extraServerSeeds[index % extraServerSeeds.length];
        const month = String(12 - (index % 12)).padStart(2, '0');
        const day = String((index % 27) + 1).padStart(2, '0');

        return {
            id: `srv-${String(index + 9).padStart(3, '0')}`,
            name:
                index < extraServerSeeds.length
                    ? name
                    : `${name} ${Math.floor(index / extraServerSeeds.length) + 1}`,
            description,
            ownerName: extraUserNames[index % extraUserNames.length],
            category,
            memberCount: 80 - index * 3,
            createdAt: `2023-${month}-${day}T08:00:00+07:00`,
            status: extraServerStatuses[index % extraServerStatuses.length],
        };
    }),
];

export const PENDING_REPORT_COUNT =
    reportStats.find((stat) => stat.key === 'pending')?.value ?? 0;
