import React from 'react';

export const LoadingSpinner: React.FC = () => (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center" aria-label="加载中">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
    </div>
);
