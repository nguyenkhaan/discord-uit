import { useEffect, useRef } from 'react';

import { ADMIN_CHECKBOX_CLASS } from '@/features/admin/components/adminVariants';

interface AdminSelectAllCheckboxProps {
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
}

export function AdminSelectAllCheckbox({
    checked,
    indeterminate,
    onChange,
}: AdminSelectAllCheckboxProps) {
    const ref = useRef<HTMLInputElement>(null);

    // indeterminate chỉ đặt được qua DOM, không có thuộc tính HTML tương ứng
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <input
            aria-label="Chọn tất cả trên trang này"
            checked={checked}
            className={ADMIN_CHECKBOX_CLASS}
            onChange={onChange}
            ref={ref}
            type="checkbox"
        />
    );
}
