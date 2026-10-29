import { Link } from 'react-router-dom';

/** Trang tạm cho các tab chưa làm, để bấm Sidebar không bị rơi vào trang 404 */
export default function ComingSoonPage({ title }: { title: string }) {
    return (
        <div className="mx-auto max-w-7xl rounded-2xl border border-line bg-surface p-8">
            <h1 className="text-2xl font-bold text-heading">{title}</h1>
            <p className="mt-2 text-foreground-secondary">Trang này đang được xây dựng.</p>
            <Link to="/home" className="mt-4 inline-block font-medium text-brand hover:text-brand-active">
                Về trang chủ
            </Link>
        </div>
    );
}