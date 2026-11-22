import type { JSONContent } from '@tiptap/react';
import { Info, SendHorizontal, VenetianMask } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { buttonVariants } from '@/components/common/buttonVariants';
import { Input } from '@/components/common/Input';
import { ForumContentEditor } from '@/features/forum/components/ForumContentEditor';
import { ForumPageMessage } from '@/features/forum/components/ForumPageMessage';
import { ForumTopicInput } from '@/features/forum/components/ForumTopicInput';
import {
    useCreateForumPostMutation,
    useForumPost,
    useUpdateForumPostMutation,
} from '@/features/forum/forum.hooks';
import type { ForumPost } from '@/features/forum/forum.type';
import {
    MAX_FORUM_TITLE_LENGTH,
    parseForumContent,
} from '@/features/forum/forum.utils';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';

const SAVE_ERROR_MESSAGES: Partial<Record<number, string>> = {
    400: 'Tiêu đề, nội dung hoặc chủ đề chưa hợp lệ. Vui lòng kiểm tra lại.',
    404: 'Bài viết không còn tồn tại.',
    409: 'Bài đã bị gỡ nên không sửa được.',
};

/** U10 — Viết bài mới hoặc sửa bài của mình */
export default function ForumPostEditorPage() {
    const { postId = '' } = useParams<{ postId: string }>();
    const isEdit = postId !== '';
    const postQuery = useForumPost(postId);

    if (!isEdit) return <ForumPostForm />;

    if (postQuery.isPending) {
        return (
            <div
                aria-busy="true"
                className="mx-auto h-96 w-full max-w-3xl animate-pulse px-4 py-6"
            />
        );
    }
    const post = postQuery.data;
    if (postQuery.isError || !post) {
        return (
            <ForumPageMessage
                description={
                    getApiErrorStatus(postQuery.error) === 404
                        ? 'Bài viết đã bị xoá hoặc không tồn tại.'
                        : 'Đã có lỗi khi tải bài viết. Vui lòng thử lại.'
                }
                title="Không mở được bài viết"
            />
        );
    }
    if (!post.mine) {
        return (
            <ForumPageMessage
                description="Chỉ tác giả mới được sửa bài viết này."
                title="Không thể sửa bài"
            />
        );
    }
    if (post.status === 'REMOVED') {
        return (
            <ForumPageMessage
                description="Bài đã bị quản trị viên gỡ nên không sửa được."
                title="Không thể sửa bài"
            />
        );
    }
    // key: tải lại bài thì khởi tạo lại form
    return <ForumPostForm key={post.id} post={post} />;
}

interface ForumPostFormProps {
    /** Có khi sửa bài */
    post?: ForumPost;
}

function ForumPostForm({ post }: ForumPostFormProps) {
    const navigate = useNavigate();
    const contentLabelId = useId();
    const isEdit = Boolean(post);

    const [title, setTitle] = useState(post?.title ?? '');
    const [topics, setTopics] = useState<string[]>(post?.topics ?? []);
    const [anonymous, setAnonymous] = useState(post?.anonymous ?? false);
    const [initialContent] = useState<JSONContent>(() =>
        parseForumContent(post?.content)
    );
    const [content, setContent] = useState<JSONContent>(initialContent);
    const [hasText, setHasText] = useState(Boolean(post));
    const [submitted, setSubmitted] = useState(false);

    const createMutation = useCreateForumPostMutation();
    const updateMutation = useUpdateForumPostMutation(post?.id ?? '');
    const mutation = isEdit ? updateMutation : createMutation;

    const trimmedTitle = title.trim();
    const titleError =
        submitted && !trimmedTitle ? 'Vui lòng nhập tiêu đề.' : undefined;
    const contentError =
        submitted && !hasText ? 'Vui lòng nhập nội dung.' : undefined;

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setSubmitted(true);
        if (!trimmedTitle || !hasText || mutation.isPending) return;

        const body = {
            title: trimmedTitle,
            content: JSON.stringify(content),
            topics,
        };
        // Lưu xong mở trang bài để thấy trạng thái chờ duyệt
        const onSuccess = (saved: ForumPost) =>
            navigate(`/forum/${saved.id}`, { replace: true });
        if (post) updateMutation.mutate(body, { onSuccess });
        else createMutation.mutate({ ...body, anonymous }, { onSuccess });
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            <nav aria-label="Đường dẫn" className="mb-3 text-sm text-muted">
                <Link className="hover:text-brand" to="/forum">
                    Diễn đàn
                </Link>
                <span aria-hidden="true"> / </span>
                <span className="text-foreground-secondary">
                    {isEdit ? 'Sửa bài viết' : 'Viết bài mới'}
                </span>
            </nav>
            <h1 className="text-2xl font-bold text-heading sm:text-[28px]">
                {isEdit ? 'Sửa bài viết' : 'Viết bài mới'}
            </h1>
            <p className="mt-1 text-body-sm text-muted">
                Chia sẻ câu hỏi, kinh nghiệm hoặc thảo luận với cộng đồng UIT.
                Bài sẽ được quản trị viên duyệt trước khi hiển thị.
            </p>

            {isEdit && (
                <p
                    className="mt-4 flex items-start gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-body-sm text-foreground-secondary"
                    role="note"
                >
                    <Info
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-brand"
                    />
                    Sau khi lưu, bài sẽ quay lại trạng thái chờ duyệt và tạm ẩn
                    khỏi diễn đàn cho đến khi được duyệt lại.
                </p>
            )}

            <form
                className="mt-5 space-y-5 rounded-xl border border-line-subtle bg-surface p-5 sm:p-6"
                noValidate
                onSubmit={handleSubmit}
            >
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label
                            className="text-sm font-semibold text-heading"
                            htmlFor="forum-title"
                        >
                            Tiêu đề bài viết{' '}
                            <span className="text-feedback-danger">*</span>
                        </label>
                        <span className="text-caption text-muted">
                            {title.length}/{MAX_FORUM_TITLE_LENGTH}
                        </span>
                    </div>
                    <Input
                        aria-describedby={
                            titleError ? 'forum-title-error' : undefined
                        }
                        aria-invalid={Boolean(titleError)}
                        disabled={mutation.isPending}
                        id="forum-title"
                        maxLength={MAX_FORUM_TITLE_LENGTH}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Nhập tiêu đề ngắn gọn, dễ hiểu..."
                        size="compact"
                        status={titleError ? 'error' : undefined}
                        value={title}
                    />
                    {titleError && (
                        <p
                            className="mt-1 text-caption text-feedback-danger"
                            id="forum-title-error"
                            role="alert"
                        >
                            {titleError}
                        </p>
                    )}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-subtle p-4 has-disabled:cursor-not-allowed">
                    <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-lg bg-heading text-on-brand"
                    >
                        <VenetianMask className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-heading">
                            Đăng bài ẩn danh
                        </span>
                        <span className="block text-body-sm text-muted">
                            {isEdit
                                ? 'Không đổi được chế độ ẩn danh sau khi đã đăng.'
                                : 'Khi bật, tên của bạn được ẩn với mọi thành viên, bài hiển thị là “Ẩn danh”.'}
                        </span>
                    </span>
                    <input
                        checked={anonymous}
                        className="mt-1 size-5 accent-brand"
                        disabled={isEdit || mutation.isPending}
                        onChange={(event) => setAnonymous(event.target.checked)}
                        role="switch"
                        type="checkbox"
                    />
                </label>

                <div>
                    <p
                        className="mb-1.5 text-sm font-semibold text-heading"
                        id={contentLabelId}
                    >
                        Nội dung <span className="text-feedback-danger">*</span>
                    </p>
                    <ForumContentEditor
                        disabled={mutation.isPending}
                        initialContent={initialContent}
                        labelId={contentLabelId}
                        onChange={(next, nextHasText) => {
                            setContent(next);
                            setHasText(nextHasText);
                        }}
                    />
                    {contentError && (
                        <p
                            className="mt-1 text-caption text-feedback-danger"
                            role="alert"
                        >
                            {contentError}
                        </p>
                    )}
                </div>

                <ForumTopicInput
                    disabled={mutation.isPending}
                    hint="Thêm chủ đề để mọi người dễ tìm bài (ví dụ: java, spring boot, kinh nghiệm). Tối đa 5."
                    label="Chủ đề"
                    onChange={setTopics}
                    topics={topics}
                />

                {mutation.isError && (
                    <p
                        className="rounded-lg bg-danger-subtle px-3 py-2 text-body-sm text-feedback-danger"
                        role="alert"
                    >
                        {getApiErrorMessage(
                            mutation.error,
                            SAVE_ERROR_MESSAGES,
                            'Không lưu được bài viết. Vui lòng thử lại.'
                        )}
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-line-subtle pt-4">
                    <Link
                        className={buttonVariants({
                            size: 'compact',
                            variant: 'secondary',
                        })}
                        to={post?.id ? `/forum/${post.id}` : '/forum'}
                    >
                        Huỷ
                    </Link>
                    <Button
                        disabled={mutation.isPending}
                        size="compact"
                        type="submit"
                    >
                        <SendHorizontal aria-hidden="true" className="size-4" />
                        {mutation.isPending
                            ? 'Đang gửi...'
                            : isEdit
                              ? 'Lưu và gửi duyệt lại'
                              : 'Gửi duyệt'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
