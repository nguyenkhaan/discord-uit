import { AlertCircle, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import type {
    TaxonomyFormValues,
    TaxonomyItem,
    TaxonomyKind,
} from '@/features/taxonomy/taxonomy.type';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface AdminTaxonomyFormModalProps {
    isOpen: boolean;
    kind: TaxonomyKind;
    item: TaxonomyItem | null;
    submitError?: string;
    onClose: () => void;
    onSave: (
        values: TaxonomyFormValues
    ) => string | undefined | Promise<string | undefined>;
}

type FieldErrors = Partial<Record<keyof TaxonomyFormValues, string>>;

function getInitialValues(
    kind: TaxonomyKind,
    item: TaxonomyItem | null
): TaxonomyFormValues {
    if (!item) return { name: '', slug: '', description: '', keywords: [] };

    return {
        name: item.name,
        slug: item.slug,
        description: item.description,
        keywords:
            kind === 'collection' && 'keywords' in item ? item.keywords : [],
    };
}

function slugify(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function AdminTaxonomyFormModal({
    isOpen,
    kind,
    item,
    submitError,
    onClose,
    onSave,
}: AdminTaxonomyFormModalProps) {
    const formId = useId();
    const [values, setValues] = useState<TaxonomyFormValues>(() =>
        getInitialValues(kind, item)
    );
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string>();
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = item !== null;
    const isCollection = kind === 'collection';
    const label = isCollection ? 'collection' : 'tag';

    function updateValue(field: keyof TaxonomyFormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        setFormError(undefined);
    }

    function validate(): FieldErrors {
        const nextErrors: FieldErrors = {};
        const name = values.name.trim();
        const slug = values.slug.trim();
        const description = values.description.trim();

        if (!name) nextErrors.name = 'Vui lòng nhập tên.';
        if (!slug) nextErrors.slug = 'Vui lòng nhập slug.';
        else if (!SLUG_PATTERN.test(slug)) {
            nextErrors.slug =
                'Slug chỉ gồm chữ thường, số và dấu gạch ngang đơn.';
        }
        if (!isCollection && !description) {
            nextErrors.description = 'Tag cần có mô tả.';
        }

        return nextErrors;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors = validate();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            setFormError('Vui lòng kiểm tra lại các trường bắt buộc.');
            return;
        }

        setIsSaving(true);
        try {
            const error = await onSave({
                name: values.name.trim(),
                slug: values.slug.trim(),
                description: values.description.trim(),
                keywords: isCollection
                    ? values.keywords
                          .map((keyword) => keyword.trim())
                          .filter(Boolean)
                    : [],
            });
            if (error) setFormError(error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Modal
            description={`${isEditing ? 'Chỉnh sửa' : 'Tạo'} ${label} trong danh mục taxonomy.`}
            footer={
                <>
                    <Button
                        disabled={isSaving}
                        onClick={onClose}
                        size="compact"
                        variant="secondary"
                    >
                        Hủy
                    </Button>
                    <Button
                        disabled={isSaving}
                        form={formId}
                        size="compact"
                        type="submit"
                    >
                        {isSaving
                            ? 'Đang lưu...'
                            : isEditing
                              ? 'Lưu thay đổi'
                              : `Tạo ${label}`}
                    </Button>
                </>
            }
            isOpen={isOpen}
            isCloseDisabled={isSaving}
            onClose={onClose}
            size="md"
            title={`${isEditing ? 'Chỉnh sửa' : 'Tạo'} ${label}`}
        >
            <form className="space-y-4" id={formId} onSubmit={handleSubmit}>
                {(formError || submitError) && (
                    <div
                        aria-live="polite"
                        className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-subtle px-3 py-2.5 text-sm text-feedback-danger"
                        role="alert"
                    >
                        <AlertCircle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <span>{formError ?? submitError}</span>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label
                        className="text-sm font-semibold text-foreground"
                        htmlFor={`${formId}-name`}
                    >
                        Tên {label}
                    </label>
                    <Input
                        aria-describedby={
                            errors.name ? `${formId}-name-error` : undefined
                        }
                        aria-invalid={Boolean(errors.name)}
                        id={`${formId}-name`}
                        onChange={(event) =>
                            updateValue('name', event.target.value)
                        }
                        placeholder={
                            isCollection
                                ? 'Ví dụ: AI và Hệ thống thông minh'
                                : 'Ví dụ: Machine Learning'
                        }
                        status={errors.name ? 'error' : undefined}
                        value={values.name}
                    />
                    {errors.name && (
                        <p
                            className="text-xs text-feedback-danger"
                            id={`${formId}-name-error`}
                        >
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        className="text-sm font-semibold text-foreground"
                        htmlFor={`${formId}-slug`}
                    >
                        Slug
                    </label>
                    <div className="flex gap-2">
                        <Input
                            aria-describedby={
                                errors.slug
                                    ? `${formId}-slug-error`
                                    : `${formId}-slug-hint`
                            }
                            aria-invalid={Boolean(errors.slug)}
                            className="min-w-0 flex-1"
                            id={`${formId}-slug`}
                            onChange={(event) =>
                                updateValue('slug', event.target.value)
                            }
                            placeholder="ai-intelligent-systems"
                            status={errors.slug ? 'error' : undefined}
                            value={values.slug}
                        />
                        <Button
                            aria-label="Tạo slug từ tên"
                            className="shrink-0"
                            onClick={() =>
                                updateValue('slug', slugify(values.name))
                            }
                            size="icon"
                            title="Tạo slug từ tên"
                            variant="secondary"
                        >
                            <Sparkles aria-hidden="true" className="size-4" />
                        </Button>
                    </div>
                    {errors.slug ? (
                        <p
                            className="text-xs text-feedback-danger"
                            id={`${formId}-slug-error`}
                        >
                            {errors.slug}
                        </p>
                    ) : (
                        <p
                            className="text-xs text-muted"
                            id={`${formId}-slug-hint`}
                        >
                            Dùng chữ thường, số và dấu gạch ngang; ví dụ
                            `data-analytics`.
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        className="text-sm font-semibold text-foreground"
                        htmlFor={`${formId}-description`}
                    >
                        Mô tả{' '}
                        {isCollection && (
                            <span className="font-normal text-muted">
                                (không bắt buộc)
                            </span>
                        )}
                    </label>
                    <textarea
                        aria-describedby={
                            errors.description
                                ? `${formId}-description-error`
                                : undefined
                        }
                        aria-invalid={Boolean(errors.description)}
                        className="min-h-24 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-line-brand-hover focus:border-brand focus:ring-3 focus:ring-focus/20"
                        id={`${formId}-description`}
                        onChange={(event) =>
                            updateValue('description', event.target.value)
                        }
                        placeholder="Mô tả ngắn giúp người dùng hiểu phạm vi taxonomy."
                        value={values.description}
                    />
                    {errors.description && (
                        <p
                            className="text-xs text-feedback-danger"
                            id={`${formId}-description-error`}
                        >
                            {errors.description}
                        </p>
                    )}
                </div>

                {isCollection && (
                    <div className="space-y-1.5">
                        <label
                            className="text-sm font-semibold text-foreground"
                            htmlFor={`${formId}-keywords`}
                        >
                            Từ khóa
                        </label>
                        <Input
                            id={`${formId}-keywords`}
                            onChange={(event) =>
                                setValues((current) => ({
                                    ...current,
                                    keywords: event.target.value.split(','),
                                }))
                            }
                            placeholder="AI, LLM, RAG"
                            value={values.keywords.join(', ')}
                        />
                        <p className="text-xs text-muted">
                            Ngăn cách các từ khóa bằng dấu phẩy.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
}
