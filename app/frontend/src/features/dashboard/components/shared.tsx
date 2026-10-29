import { ArrowRight } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import type { RichText, Tone } from '../dashboard.type';

export const toneClasses: Record<Tone, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-500',
    purple: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-500',
    teal: 'bg-teal-50 text-teal-600',
};

/** Khung card có tiêu đề + link "Xem tất cả" — dùng cho mọi khối trên trang chủ */
interface SectionCardProps extends PropsWithChildren {
    title: string;
    viewAllTo?: string;
    className?: string;
}

export function SectionCard({ title, viewAllTo, className, children }: SectionCardProps) {
    return (
        <section className={cn('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-heading">{title}</h2>
                {viewAllTo && (
                    <Link
                        to={viewAllTo}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-brand hover:text-brand-active focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    >
                        Xem tất cả
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

/** Hiển thị mảng RichText, phần nào bold thì in đậm */
export function RichTextView({ parts }: { parts: RichText }) {
    return (
        <>
            {parts.map((part, index) =>
                part.bold ? (
                    <strong key={index} className="font-semibold text-heading">
                        {part.text}
                    </strong>
                ) : (
                    <span key={index}>{part.text}</span>
                )
            )}
        </>
    );
}

/** Avatar tròn: có ảnh thì hiện ảnh, không thì hiện chữ cái đầu (VD: Nguyễn Minh → NM) */
export function PersonAvatar({ name, src, className }: { name: string; src?: string; className?: string }) {
    const words = name.trim().split(/\s+/);
    const initials = (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();

    if (src) {
        return <img src={src} alt={name} className={cn('size-11 shrink-0 rounded-full object-cover', className)} />;
    }

    return (
        <span
            aria-hidden="true"
            className={cn('grid size-11 shrink-0 place-items-center rounded-full bg-brand-subtle text-sm font-semibold text-brand', className)}
        >
            {initials}
        </span>
    );
}

/** 1200 → "1.2k", 856 → "856" */
export function formatCount(value: number) {
    if (value < 1000) return String(value);
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}