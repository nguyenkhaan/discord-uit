const DEFAULT_REDIRECT_PATH = '/home';

/**
 * Lấy đường dẫn AuthGuard đã lưu trong `location.state.from` để quay lại sau khi đăng nhập.
 * Chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng một dấu `/`) để tránh open redirect.
 */
export function getPostLoginRedirect(locationState: unknown): string {
    if (typeof locationState !== 'object' || locationState === null) {
        return DEFAULT_REDIRECT_PATH;
    }
    const from: unknown = Reflect.get(locationState, 'from');
    if (typeof from !== 'object' || from === null) {
        return DEFAULT_REDIRECT_PATH;
    }
    const pathname: unknown = Reflect.get(from, 'pathname');
    const search: unknown = Reflect.get(from, 'search');
    if (
        typeof pathname !== 'string' ||
        !pathname.startsWith('/') ||
        pathname.startsWith('//')
    ) {
        return DEFAULT_REDIRECT_PATH;
    }
    return typeof search === 'string' ? `${pathname}${search}` : pathname;
}
