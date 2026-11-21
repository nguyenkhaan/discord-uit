import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/common/buttonVariants';

interface ForumPageMessageProps {
    title: string;
    description: string;
}

/** Thông báo cả trang: không tìm thấy bài, không có quyền... */
export function ForumPageMessage({
    title,
    description,
}: ForumPageMessageProps) {
    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
            <h1 className="text-xl font-bold text-heading">{title}</h1>
            <p className="mt-2 text-body-sm text-muted">{description}</p>
            <Link
                className={`${buttonVariants({ size: 'compact', variant: 'secondary' })} mt-6`}
                to="/forum"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Về diễn đàn
            </Link>
        </div>
    );
}
