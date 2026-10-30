import { privateClient } from '@/api/client';
import type { components } from '@/contract/api-contract';

// Trích xuất Type từ api-contract tự động sinh
export type ServerResponse = components['schemas']['ServerResponse'];

export const getServers = async (): Promise<ServerResponse[]> => {
    const response = await privateClient.get('/servers');
    
    // Đề phòng Backend bọc dữ liệu trong biến content (nếu có phân trang)
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    
    return [];
};

export const createServer = async (formData: FormData): Promise<ServerResponse> => {
    const response = await privateClient.post('/servers', formData, {
        headers: {
            // CỰC KỲ QUAN TRỌNG: Ghi đè lại 'application/json' mặc định ở file client.ts
            // để Backend Spring Boot hiểu đây là file/form data
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};