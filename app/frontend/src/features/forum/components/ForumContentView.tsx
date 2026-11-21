import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import {
    FORUM_PROSE_CLASS,
    parseForumContent,
} from '@/features/forum/forum.utils';

interface ForumContentViewProps {
    /** Chuỗi JSON của bài */
    content: string | undefined;
}

/** Hiển thị nội dung bài chỉ đọc; Tiptap tự lọc node/link không an toàn */
export function ForumContentView({ content }: ForumContentViewProps) {
    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    heading: { levels: [2, 3] },
                    link: {
                        openOnClick: true,
                        protocols: ['http', 'https', 'mailto'],
                        HTMLAttributes: {
                            rel: 'noopener noreferrer nofollow',
                            target: '_blank',
                        },
                    },
                }),
            ],
            content: parseForumContent(content),
            editable: false,
            editorProps: { attributes: { class: FORUM_PROSE_CLASS } },
        },
        [content]
    );

    return <EditorContent editor={editor} />;
}
