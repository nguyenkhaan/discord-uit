import type { components } from '@/contract/api-contract';

type Schemas = components['schemas'];

/** Bài trong danh sách công khai */
export type ForumPostSummary = Schemas['ForumPostSummaryResponse'];
export type ForumPostPage = Schemas['ForumPostPageResponse'];

/** Chi tiết bài; content là chuỗi JSON của Tiptap */
export type ForumPost = Schemas['ForumPostResponse'];

/** Bài của tôi, kèm trạng thái duyệt */
export type MyForumPost = Schemas['MyForumPostResponse'];
export type MyForumPostPage = Schemas['MyForumPostPageResponse'];

export type CreateForumPostRequest = Schemas['CreateForumPostRequest'];
export type UpdateForumPostRequest = Schemas['UpdateForumPostRequest'];

export type ForumPostStatus = NonNullable<MyForumPost['status']>;

/** Bộ lọc danh sách công khai */
export interface ForumPostFilter {
    q: string;
    topics: string[];
}
