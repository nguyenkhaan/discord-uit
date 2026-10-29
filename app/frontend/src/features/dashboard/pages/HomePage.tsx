import { MyServersCard } from '../components/MyServersCard';
import { NotificationsCard } from '../components/NotificationsCard';
import { QuickLinkCard } from '../components/QuickLinkCard';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { SuggestedDocumentsCard } from '../components/SuggestedDocumentsCard';
import {
    myServers,
    notifications,
    quickLinks,
    recentActivities,
    suggestedDocuments,
} from '../dashboard.mock';
import { useAuth } from '@/context/useAuth';
export default function HomePage() {
    // TODO: lấy tên thật từ auth context, VD: const { user } = useAuth();
    const { user } = useAuth();
    const userName = user?.fullName ?? 'bạn';

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5">
            <header>
                <h1 className="text-2xl font-bold text-heading sm:text-3xl">
                    Chào {userName} <span aria-hidden="true">👋</span>
                </h1>
                <p className="mt-1 text-sm text-foreground-secondary sm:text-base">
                    Chào mừng bạn trở lại với UIT Connect. Cùng học hỏi, chia sẻ và phát triển!
                </p>
            </header>

            {/* Hàng 1: Server của tôi | 4 ô truy cập nhanh (2x2) */}
            <div className="grid gap-5 lg:grid-cols-2">
                <MyServersCard servers={myServers} />
                <div className="grid gap-4 sm:grid-cols-2">
                    {quickLinks.map((link) => (
                        <QuickLinkCard key={link.id} {...link} />
                    ))}
                </div>
            </div>

            {/* Hàng 2: Thông báo mới (full width) */}
            <NotificationsCard notifications={notifications} />

            {/* Hàng 3: Hoạt động gần đây | Gợi ý tài liệu */}
            <div className="grid gap-5 lg:grid-cols-2">
                <RecentActivityCard activities={recentActivities} />
                <SuggestedDocumentsCard documents={suggestedDocuments} />
            </div>
        </div>
    );
}