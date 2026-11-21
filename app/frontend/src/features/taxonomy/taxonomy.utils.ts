import axios from 'axios';

export function getTaxonomyErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data;
        if (
            typeof message === 'object' &&
            message !== null &&
            'message' in message &&
            typeof message.message === 'string' &&
            message.message.trim()
        ) {
            return message.message;
        }
    }
    return fallback;
}
