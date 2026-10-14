import type { KeyboardEvent } from 'react';

import { Button } from '@/components/common/Button';

export type AccountType = 'personal' | 'student';

type AccountTab = {
    id: AccountType;
    label: string;
    panelId: string;
};

const accountTabs: readonly AccountTab[] = [
    {
        id: 'personal',
        label: 'Tài khoản cá nhân',
        panelId: 'personal-account-panel',
    },
    {
        id: 'student',
        label: 'Sinh viên UIT',
        panelId: 'student-account-panel',
    },
];

type AccountTypeTabsProps = {
    activeTab: AccountType;
    onTabChange: (tab: AccountType) => void;
};

export function AccountTypeTabs({
    activeTab,
    onTabChange,
}: AccountTypeTabsProps) {
    function activateTab(index: number) {
        const tab = accountTabs[index];

        if (!tab) {
            return;
        }

        onTabChange(tab.id);
        document.getElementById(`${tab.id}-account-tab`)?.focus();
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        currentIndex: number
    ) {
        const lastIndex = accountTabs.length - 1;
        let nextIndex: number;

        switch (event.key) {
            case 'ArrowRight':
                nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
                break;
            case 'ArrowLeft':
                nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = lastIndex;
                break;
            default:
                return;
        }

        event.preventDefault();
        activateTab(nextIndex);
    }

    return (
        <div
            aria-label="Loại tài khoản"
            className="mt-8 grid grid-cols-2 border-b border-line-muted"
            role="tablist"
        >
            {accountTabs.map((tab, index) => {
                const isActive = activeTab === tab.id;

                return (
                    <Button
                        aria-controls={tab.panelId}
                        aria-selected={isActive}
                        fullWidth
                        id={`${tab.id}-account-tab`}
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        role="tab"
                        size="tab"
                        tabIndex={isActive ? 0 : -1}
                        variant="tab"
                    >
                        {tab.label}
                    </Button>
                );
            })}
        </div>
    );
}
