import React from 'react';
import { User, Project, OKR, ProjectStatus, Priority } from '../types';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { KRFilterButton } from './KRFilterButton';

interface KanbanFilterBarProps {
    allUsers: User[];
    allProjects: Project[];
    activeOkrs: OKR[];
    selectedUsers: string[];
    setSelectedUsers: (ids: string[]) => void;
    selectedProjects: string[];
    setSelectedProjects: (ids: string[]) => void;
    selectedKrs: string[];
    setSelectedKrs: (ids: string[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    selectedPriorities: string[];
    setSelectedPriorities: (priorities: string[]) => void;
}

export const KanbanFilterBar: React.FC<KanbanFilterBarProps> = ({
    allUsers,
    allProjects,
    activeOkrs,
    selectedUsers,
    setSelectedUsers,
    selectedProjects,
    setSelectedProjects,
    selectedKrs,
    setSelectedKrs,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities
}) => {
    
    const userOptions = allUsers.map(u => ({ value: u.id, label: u.name }));
    const projectOptions = allProjects.map(p => ({ value: p.id, label: p.name }));
    
    // 状态选项
    const statusOptions = Object.values(ProjectStatus).map(status => ({
        value: status,
        label: status
    }));
    
    // 优先级选项
    const priorityOptions = Object.values(Priority).map(priority => ({
        value: priority,
        label: priority
    }));
    
    return (
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl p-4 flex flex-wrap items-center gap-4 flex-shrink-0 relative z-30">
            <MultiSelectDropdown
                options={userOptions}
                selectedValues={selectedUsers}
                onSelectionChange={setSelectedUsers}
                placeholder="按成员筛选"
            />
            <MultiSelectDropdown
                options={projectOptions}
                selectedValues={selectedProjects}
                onSelectionChange={setSelectedProjects}
                placeholder="按项目筛选"
            />
            <MultiSelectDropdown
                options={statusOptions}
                selectedValues={selectedStatuses}
                onSelectionChange={setSelectedStatuses}
                placeholder="按状态筛选"
            />
            <MultiSelectDropdown
                options={priorityOptions}
                selectedValues={selectedPriorities}
                onSelectionChange={setSelectedPriorities}
                placeholder="按优先级筛选"
            />
            <KRFilterButton
                activeOkrs={activeOkrs}
                selectedKrs={selectedKrs}
                setSelectedKrs={setSelectedKrs}
                placeholder="按KR筛选"
            />
        </div>
    );
};