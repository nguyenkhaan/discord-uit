import axios from 'axios';

/** HTTP status của lỗi từ API, hoặc undefined khi lỗi mạng / lỗi không phải từ Axios */
export function getApiErrorStatus(error: unknown): number | undefined {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Chọn thông báo tiếng Việt theo HTTP status, rơi về `fallback` nếu không khớp */
export function getApiErrorMessage(
    error: unknown,
    messagesByStatus: Partial<Record<number, string>>,
    fallback: string
): string {
    const status = getApiErrorStatus(error);
    return (status !== undefined && messagesByStatus[status]) || fallback;
}
