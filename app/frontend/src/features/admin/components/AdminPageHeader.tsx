interface AdminPageHeaderProps {
    title: string;
    description: string;
}

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
    return (
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-heading sm:text-3xl">
                {title}
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary sm:text-base">
                {description}
            </p>
        </div>
    );
}
