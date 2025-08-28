

import React from 'react';

interface KanbanTimelineControlsProps {
  granularity: 'week' | 'month';
  onGranularityChange: (granularity: 'week' | 'month') => void;
  onPrev: () => void;
  onNext: () => void;
  rangeLabel: string;
}

const NavButton: React.FC<{ children: React.ReactNode, onClick: () => void, 'aria-label': string }> = ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
        {children}
    </button>
);


export const KanbanTimelineControls: React.FC<KanbanTimelineControlsProps> = ({ granularity, onGranularityChange, onPrev, onNext, rangeLabel }) => {
    const commonButtonClass = "px-3 py-1.5 text-sm font-semibold rounded-md transition-colors";
    const activeButtonClass = "bg-[#6C63FF] text-white";
    const inactiveButtonClass = "bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a3a3a]";

    return (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-[#363636] bg-white dark:bg-[#232323]">
            <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-200 dark:bg-[#2d2d2d] rounded-lg flex">
                    <button 
                        onClick={() => onGranularityChange('week')}
                        className={`${commonButtonClass} ${granularity === 'week' ? activeButtonClass : inactiveButtonClass}`}
                    >
                        周
                    </button>
                    <button 
                        onClick={() => onGranularityChange('month')}
                        className={`${commonButtonClass} ${granularity === 'month' ? activeButtonClass : inactiveButtonClass}`}
                    >
                        月
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <NavButton onClick={onPrev} aria-label="Previous period">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </NavButton>
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-48 text-center">{rangeLabel}</span>
                 <NavButton onClick={onNext} aria-label="Next period">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </NavButton>
            </div>
        </div>
    );
};