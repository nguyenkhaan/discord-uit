import { CharacterCount, Placeholder } from '@tiptap/extensions';
import {
    EditorContent,
    useEditor,
    useEditorState,
    type Editor,
    type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Code,
    CodeXml,
    Heading2,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Strikethrough,
    Underline,
    Undo2,
    type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import {
    FORUM_PROSE_CLASS,
    MAX_FORUM_TEXT_LENGTH,
} from '@/features/forum/forum.utils';
import { cn } from '@/lib/utils';

interface ForumContentEditorProps {
    labelId: string;
    initialContent: JSONContent;
    /** hasText: có chữ (bỏ khoảng trắng) để kiểm tra bài trống */
    onChange: (content: JSONContent, hasText: boolean) => void;
    disabled?: boolean;
}

/** Trình soạn nội dung bài (Tiptap), xuất JSON */
export function ForumContentEditor({
    labelId,
    initialContent,
    onChange,
    disabled,
}: ForumContentEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    protocols: ['http', 'https', 'mailto'],
                },
            }),
            Placeholder.configure({
                placeholder: 'Viết nội dung bài viết của bạn ở đây...',
            }),
            CharacterCount.configure({ limit: MAX_FORUM_TEXT_LENGTH }),
        ],
        content: initialContent,
        editable: !disabled,
        editorProps: {
            attributes: {
                'aria-labelledby': labelId,
                'aria-multiline': 'true',
                role: 'textbox',
                class: cn(FORUM_PROSE_CLASS, 'min-h-60 px-4 py-3 outline-none'),
            },
        },
        onUpdate: ({ editor: current }) =>
            onChange(current.getJSON(), current.getText().trim().length > 0),
    });

    const characters = useEditorState({
        editor,
        selector: ({ editor: current }) =>
            current.storage.characterCount.characters(),
    });

    return (
        <div className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-brand focus-within:ring-3 focus-within:ring-focus/20">
            <EditorToolbar disabled={disabled} editor={editor} />
            <EditorContent editor={editor} />
            <p className="border-t border-line-subtle px-4 py-1.5 text-right text-caption text-muted">
                {characters}/{MAX_FORUM_TEXT_LENGTH}
            </p>
        </div>
    );
}

interface ToolbarAction {
    key: string;
    label: string;
    icon: LucideIcon;
    isActive: (editor: Editor) => boolean;
    run: (editor: Editor) => void;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
    {
        key: 'heading',
        label: 'Tiêu đề phụ',
        icon: Heading2,
        isActive: (e) => e.isActive('heading', { level: 2 }),
        run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        key: 'bold',
        label: 'In đậm',
        icon: Bold,
        isActive: (e) => e.isActive('bold'),
        run: (e) => e.chain().focus().toggleBold().run(),
    },
    {
        key: 'italic',
        label: 'In nghiêng',
        icon: Italic,
        isActive: (e) => e.isActive('italic'),
        run: (e) => e.chain().focus().toggleItalic().run(),
    },
    {
        key: 'underline',
        label: 'Gạch chân',
        icon: Underline,
        isActive: (e) => e.isActive('underline'),
        run: (e) => e.chain().focus().toggleUnderline().run(),
    },
    {
        key: 'strike',
        label: 'Gạch ngang',
        icon: Strikethrough,
        isActive: (e) => e.isActive('strike'),
        run: (e) => e.chain().focus().toggleStrike().run(),
    },
    {
        key: 'bulletList',
        label: 'Danh sách',
        icon: List,
        isActive: (e) => e.isActive('bulletList'),
        run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
        key: 'orderedList',
        label: 'Danh sách đánh số',
        icon: ListOrdered,
        isActive: (e) => e.isActive('orderedList'),
        run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
        key: 'blockquote',
        label: 'Trích dẫn',
        icon: Quote,
        isActive: (e) => e.isActive('blockquote'),
        run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
        key: 'code',
        label: 'Code trong dòng',
        icon: Code,
        isActive: (e) => e.isActive('code'),
        run: (e) => e.chain().focus().toggleCode().run(),
    },
    {
        key: 'codeBlock',
        label: 'Khối code',
        icon: CodeXml,
        isActive: (e) => e.isActive('codeBlock'),
        run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
];

const TOOL_BUTTON_CLASS =
    'size-9 min-h-9 rounded-md aria-pressed:bg-brand-subtle aria-pressed:text-brand';

function EditorToolbar({
    editor,
    disabled,
}: {
    editor: Editor;
    disabled?: boolean;
}) {
    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            active: TOOLBAR_ACTIONS.map((action) => action.isActive(current)),
            isLink: current.isActive('link'),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
        }),
    });

    function openLink() {
        setLinkUrl(editor.getAttributes('link').href ?? '');
        setIsLinkOpen(true);
    }

    // Link rỗng là bỏ link
    function applyLink(event: FormEvent) {
        event.preventDefault();
        const url = linkUrl.trim();
        const chain = editor.chain().focus().extendMarkRange('link');
        if (url) chain.setLink({ href: url }).run();
        else chain.unsetLink().run();
        setIsLinkOpen(false);
    }

    return (
        <div className="border-b border-line-subtle bg-surface-subtle">
            <div
                aria-label="Định dạng nội dung"
                className="flex flex-wrap items-center gap-0.5 px-2 py-1"
                role="toolbar"
            >
                {TOOLBAR_ACTIONS.map((action, index) => (
                    <Button
                        aria-label={action.label}
                        aria-pressed={state.active[index]}
                        className={TOOL_BUTTON_CLASS}
                        disabled={disabled}
                        key={action.key}
                        onClick={() => action.run(editor)}
                        size="icon"
                        title={action.label}
                        variant="ghost"
                    >
                        <action.icon aria-hidden="true" className="size-4" />
                    </Button>
                ))}
                <Button
                    aria-expanded={isLinkOpen}
                    aria-label="Chèn link"
                    aria-pressed={state.isLink}
                    className={TOOL_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={openLink}
                    size="icon"
                    title="Chèn link"
                    variant="ghost"
                >
                    <Link2 aria-hidden="true" className="size-4" />
                </Button>
                <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
                <Button
                    aria-label="Hoàn tác"
                    className={TOOL_BUTTON_CLASS}
                    disabled={disabled || !state.canUndo}
                    onClick={() => editor.chain().focus().undo().run()}
                    size="icon"
                    title="Hoàn tác"
                    variant="ghost"
                >
                    <Undo2 aria-hidden="true" className="size-4" />
                </Button>
                <Button
                    aria-label="Làm lại"
                    className={TOOL_BUTTON_CLASS}
                    disabled={disabled || !state.canRedo}
                    onClick={() => editor.chain().focus().redo().run()}
                    size="icon"
                    title="Làm lại"
                    variant="ghost"
                >
                    <Redo2 aria-hidden="true" className="size-4" />
                </Button>
            </div>

            {isLinkOpen && (
                <form
                    className="flex flex-wrap items-center gap-2 border-t border-line-subtle px-3 py-2"
                    onSubmit={applyLink}
                >
                    <label className="sr-only" htmlFor="forum-link-url">
                        Địa chỉ link
                    </label>
                    <input
                        autoFocus
                        className="min-h-9 min-w-48 flex-1 rounded-md border border-line bg-surface px-2 text-sm outline-none focus:border-brand"
                        id="forum-link-url"
                        onChange={(event) => setLinkUrl(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setIsLinkOpen(false);
                        }}
                        placeholder="https://..."
                        type="url"
                        value={linkUrl}
                    />
                    <Button className="min-h-9" size="compact" type="submit">
                        {linkUrl.trim() ? 'Gắn link' : 'Bỏ link'}
                    </Button>
                    <Button
                        className="min-h-9"
                        onClick={() => setIsLinkOpen(false)}
                        size="compact"
                        variant="ghost"
                    >
                        Huỷ
                    </Button>
                </form>
            )}
        </div>
    );
}
