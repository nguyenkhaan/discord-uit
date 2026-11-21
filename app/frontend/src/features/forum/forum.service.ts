import { privateClient } from '@/api/client';
import type {
    CreateForumPostRequest,
    ForumPost,
    ForumPostFilter,
    ForumPostPage,
    MyForumPostPage,
    UpdateForumPostRequest,
} from '@/features/forum/forum.type';

const FORUM_POSTS_ENDPOINT = '/forum/posts';

export const FORUM_PAGE_SIZE = 20;

/** Gửi topics=a&topics=b thay vì topics[]=a cho Spring */
const REPEAT_PARAMS = { indexes: null } as const;

/** GET /forum/posts — bài đã duyệt */
export async function searchForumPosts(
    filter: ForumPostFilter,
    page: number
): Promise<ForumPostPage> {
    const response = await privateClient.get<ForumPostPage>(
        FORUM_POSTS_ENDPOINT,
        {
            params: {
                q: filter.q || undefined,
                topics: filter.topics.length > 0 ? filter.topics : undefined,
                page,
                size: FORUM_PAGE_SIZE,
            },
            paramsSerializer: REPEAT_PARAMS,
        }
    );
    return response.data;
}

/** GET /forum/posts/mine — bài của tôi ở mọi trạng thái */
export async function listMyForumPosts(page: number): Promise<MyForumPostPage> {
    const response = await privateClient.get<MyForumPostPage>(
        `${FORUM_POSTS_ENDPOINT}/mine`,
        { params: { page, size: FORUM_PAGE_SIZE } }
    );
    return response.data;
}

export async function getForumPost(postId: string): Promise<ForumPost> {
    const response = await privateClient.get<ForumPost>(
        `${FORUM_POSTS_ENDPOINT}/${postId}`
    );
    return response.data;
}

export async function createForumPost(
    body: CreateForumPostRequest
): Promise<ForumPost> {
    const response = await privateClient.post<ForumPost>(
        FORUM_POSTS_ENDPOINT,
        body
    );
    return response.data;
}

export async function updateForumPost(
    postId: string,
    body: UpdateForumPostRequest
): Promise<ForumPost> {
    const response = await privateClient.put<ForumPost>(
        `${FORUM_POSTS_ENDPOINT}/${postId}`,
        body
    );
    return response.data;
}

export async function deleteForumPost(postId: string): Promise<void> {
    await privateClient.delete(`${FORUM_POSTS_ENDPOINT}/${postId}`);
}
