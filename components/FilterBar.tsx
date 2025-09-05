import React, { useMemo } from 'react';
import { User, ProjectStatus, Priority, OKR } from '../types';
import { IconSearch } from './Icons';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface FilterBarProps {
    allUsers: User[];
    activeOkrs: OKR[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    selectedPriorities: string[];
    setSelectedPriorities: (priorities: string[]) => void;
    selectedPMs: string[];
    setSelectedPMs: (pmIds: string[]) => void;
    selectedBEs: string[];
    setSelectedBEs: (beIds: string[]) => void;
    selectedFEs: string[];
    setSelectedFEs: (feIds: string[]) => void;
    selectedQAs: string[];
    setSelectedQAs: (qaIds: string[]) => void;
    selectedKrs: string[];
    setSelectedKrs: (krIds: string[]) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    allUsers,
    activeOkrs,
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
    selectedPMs,
    setSelectedPMs,
    selectedBEs,
    setSelectedBEs,
    selectedFEs,
    setSelectedFEs,
    selectedQAs,
    setSelectedQAs,
    selectedKrs,
    setSelectedKrs,
}) => {
    
    const statusOptions = [
        ProjectStatus.NotStarted,
        ProjectStatus.Discussion,
        ProjectStatus.RequirementsDone,
        ProjectStatus.ReviewDone,
        ProjectStatus.ProductDesign,
        ProjectStatus.InProgress,
        ProjectStatus.DevDone,
        ProjectStatus.Testing,
        ProjectStatus.TestDone,
        ProjectStatus.Launched,
        ProjectStatus.Paused,
        ProjectStatus.ProjectInProgress,
    ].map(s => ({ value: s, label: s }));
    const priorityOptions = Object.values(Priority).map(p => ({ value: p, label: p }));
    const userOptions = allUsers
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        .map(u => ({ value: u.id, label: u.name }));
    
    const krGroupedOptions = useMemo(() => {
        return activeOkrs.map((okr, index) => ({
            label: `O${index + 1}: ${okr.objective}`,
            options: okr.keyResults.map((kr, krIndex) => ({
                value: kr.id,
                label: `KR${krIndex + 1}: ${kr.description}`
            }))
        }));
    }, [activeOkrs]);
    
    return (
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl p-4 shadow-sm">
            {/* 搜索和筛选器一行布局 */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* 搜索框 - 自适应宽度 */}
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="搜索项目..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-lg pl-10 pr-4 py-2.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] transition-all shadow-sm"
                    />
                </div>
                
                {/* 筛选器组 */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <MultiSelectDropdown
                            options={statusOptions}
                            selectedValues={selectedStatuses}
                            onSelectionChange={setSelectedStatuses}
                            placeholder="状态"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            options={priorityOptions}
                            selectedValues={selectedPriorities}
                            onSelectionChange={setSelectedPriorities}
                            placeholder="优先级"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            options={userOptions}
                            selectedValues={selectedPMs}
                            onSelectionChange={setSelectedPMs}
                            placeholder="产品经理"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            options={userOptions}
                            selectedValues={selectedBEs}
                            onSelectionChange={setSelectedBEs}
                            placeholder="后端研发"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            options={userOptions}
                            selectedValues={selectedFEs}
                            onSelectionChange={setSelectedFEs}
                            placeholder="前端研发"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            options={userOptions}
                            selectedValues={selectedQAs}
                            onSelectionChange={setSelectedQAs}
                            placeholder="测试"
                        />
                    </div>
                    <div className="relative">
                        <MultiSelectDropdown
                            groupedOptions={krGroupedOptions}
                            selectedValues={selectedKrs}
                            onSelectionChange={setSelectedKrs}
                            placeholder="关联OKR"
                        />
                    </div>
                </div>
                
                {/* 清除按钮 */}
                {(selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedPMs.length > 0 || selectedBEs.length > 0 || 
                  selectedFEs.length > 0 || selectedQAs.length > 0 || selectedKrs.length > 0 || searchTerm.trim()) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedStatuses([]);
                            setSelectedPriorities([]);
                            setSelectedPMs([]);
                            setSelectedBEs([]);
                            setSelectedFEs([]);
                            setSelectedQAs([]);
                            setSelectedKrs([]);
                        }}
                        className="flex-shrink-0 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-[#6C63FF] dark:hover:text-[#A29DFF] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] rounded-lg transition-all border border-gray-200 dark:border-[#4a4a4a]"
                    >
                        清除筛选
                    </button>
                )}
            </div>
        </div>
    );
};