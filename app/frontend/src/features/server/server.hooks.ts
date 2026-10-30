import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServers, createServer } from './server.service';

export const useGetServers = () => {
    return useQuery({
        queryKey: ['servers', 'listMine'],
        queryFn: getServers,
    });
};

export const useCreateServerMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createServer,
        onSuccess: (data) => {
            // In ra console khi tạo thành công
            console.log("🚀 [HOOK] TẠO SERVER THÀNH CÔNG! Dữ liệu BE trả về:", data);
            
            // Báo cho React Query biết danh sách server đã cũ, cần lấy lại danh sách mới
            queryClient.invalidateQueries({ queryKey: ['servers', 'listMine'] });
        },
        onError: (error) => {
            console.error("❌ [HOOK] Lỗi khi tạo server:", error);
        }
    });
};