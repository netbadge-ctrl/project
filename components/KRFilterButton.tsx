import React, { useState, useRef } from 'react';
import { OKR } from '../types';
import KRSelectionModal from './KRSelectionModal';

interface KRFilterButtonProps {
    activeOkrs: OKR[];
    selectedKrs: string[];
    setSelectedKrs: (ids: string[]) => void;
    placeholder?: string;
}

export const KRFilterButton: React.FC<KRFilterButtonProps> = ({
    activeOkrs,
    selectedKrs,
    setSelectedKrs,
    placeholder = "按KR筛选"
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = (newKrIds: string[]) => {
        setSelectedKrs(newKrIds);
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleOpenModal}
                className="px-3 py-2 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#363636] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center gap-2 min-w-[120px] justify-between"
            >
                <span className={selectedKrs.length > 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
                    {selectedKrs.length > 0 ? `已选择 ${selectedKrs.length} 个KR` : placeholder}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <KRSelectionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                allOkrs={activeOkrs}
                selectedKrIds={selectedKrs}
                onSave={handleSave}
                title="筛选KR"
            />
        </>
    );
};