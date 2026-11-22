const KIB = 1024;
const MIB = KIB * 1024;
const GIB = MIB * 1024;

export function formatFileSize(sizeBytes: number): string {
    const bytes = Math.max(0, sizeBytes);
    if (bytes < KIB) return `${bytes} B`;
    if (bytes < MIB) return `${(bytes / KIB).toFixed(1)} KB`;
    if (bytes < GIB) return `${(bytes / MIB).toFixed(1)} MB`;
    return `${(bytes / GIB).toFixed(1)} GB`;
}
