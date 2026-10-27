export default function Avatar() {
    return (
        <div className="flex items-center justify-center gap-2">
            <span
                aria-label="Ảnh đại diện Cloudian"
                className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand"
                role="img"
            >
                C
            </span>
            <div className="flex flex-col justify-between items-start">
                <span className="hidden text-sm font-bold text-heading lg:block">
                    Cloudian
                </span>
                <span className="hidden text-xs lg:block font-semibold text-gray-400">Student</span>
            </div>
        </div>
    )
}