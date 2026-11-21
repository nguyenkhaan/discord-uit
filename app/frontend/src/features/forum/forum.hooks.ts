import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { forumKeys } from '@/features/forum/forum.keys';
import {
    createForumPost,
    deleteForumPost,
    getForumPost,
    listMyForumPosts,
    searchForumPosts,
    updateForumPost,
} from '@/features/forum/forum.service';
import type {
    ForumPost,
    ForumPostFilter,
    UpdateForumPostRequest,
} from '@/features/forum/forum.type';

/** Trang tiếp theo, undefined khi đã hết */
function nextPage(page: { page?: number; totalPages?: number }) {
    const current = page.page ?? 0;
    return current + 1 < (page.totalPages ?? 0) ? current + 1 : undefined;
}

/** Danh sách bài đã duyệt theo bộ lọc */
export function useForumFeed(filter: ForumPostFilter) {
    return useInfiniteQuery({
        queryKey: forumKeys.list(filter),
        queryFn: ({ pageParam }) => searchForumPosts(filter, pageParam),
        initialPageParam: 0,
        getNextPageParam: nextPage,
    });
}

/** Bài của tôi */
export function useMyForumPosts(enabled: boolean) {
    return useInfiniteQuery({
        enabled,
        queryKey: forumKeys.mine(),
        queryFn: ({ pageParam }) => listMyForumPosts(pageParam),
        initialPageParam: 0,
        getNextPageParam: nextPage,
    });
}

export function useForumPost(postId: string) {
    return useQuery({
        enabled: postId !== '',
        queryKey: forumKeys.detail(postId),
        queryFn: () => getForumPost(postId),
        retry: false,
    });
}

/** Đăng/sửa/xoá xong thì tải lại mọi danh sách forum */
function useInvalidateForum() {
    const queryClient = useQueryClient();
    return (post?: ForumPost) => {
        if (post?.id) queryClient.setQueryData(forumKeys.detail(post.id), post);
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: forumKeys.lists() }),
            queryClient.invalidateQueries({ queryKey: forumKeys.mine() }),
        ]);
    };
}

export function useCreateForumPostMutation() {
    const invalidate = useInvalidateForum();
    return useMutation({
        mutationFn: createForumPost,
        onSuccess: (post) => invalidate(post),
    });
}

export function useUpdateForumPostMutation(postId: string) {
    const invalidate = useInvalidateForum();
    return useMutation({
        mutationFn: (body: UpdateForumPostRequest) =>
            updateForumPost(postId, body),
        onSuccess: (post) => invalidate(post),
    });
}

export function useDeleteForumPostMutation() {
    const queryClient = useQueryClient();
    const invalidate = useInvalidateForum();
    return useMutation({
        mutationFn: deleteForumPost,
        onSuccess: (_data, postId) => {
            queryClient.removeQueries({ queryKey: forumKeys.detail(postId) });
            return invalidate();
        },
    });
}
