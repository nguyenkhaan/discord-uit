import type { ForumPostFilter } from '@/features/forum/forum.type';

export const forumKeys = {
    all: ['forum'] as const,
    lists: () => [...forumKeys.all, 'list'] as const,
    list: (filter: ForumPostFilter) => [...forumKeys.lists(), filter] as const,
    mine: () => [...forumKeys.all, 'mine'] as const,
    detail: (postId: string) => [...forumKeys.all, 'detail', postId] as const,
};
