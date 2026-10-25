import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privateClient } from '@/api/client';
import type { SendNotificationPayload } from './notification.types';

// 1. Hook Lấy danh sách thông báo cho Chuông
export const useGetNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await privateClient.get('/notifications');
      const data = response.data;

      // Xử lý an toàn dữ liệu trả về để tránh lỗi crash .filter()
      if (Array.isArray(data)) return data;
      if (data?.items && Array.isArray(data.items)) return data.items;
      if (data?.content && Array.isArray(data.content)) return data.content;
      if (data?.notifications && Array.isArray(data.notifications)) return data.notifications;

      console.warn("⚠ Cảnh báo: API /notifications không trả về mảng hợp lệ:", data);
      return []; // Trả về mảng rỗng để bảo vệ giao diện không bị sập
    },
  });
};

// 2. Hook Đánh dấu đã đọc
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await privateClient.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// 3. Hook Xóa thông báo
export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await privateClient.delete(`/notifications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// 4. Hook Admin gửi thông báo (Đã chuẩn hóa Payload theo Backend)
export const useSendNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendNotificationPayload) => {
      const response = await privateClient.post('/admin/notifications/messages', {
        recipientUserId: "dd3344db-0c80-4b69-8836-bdaf27975ca7",
        
        // Gom title và message thành field 'content' để khớp với SendAdminMessageRequest của BE
        content: `[${payload.title}] ${payload.message}`.substring(0, 255) 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};