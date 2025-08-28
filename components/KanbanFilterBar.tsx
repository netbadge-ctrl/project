import React from 'react';
import { User, Project, OKR } from '../types';
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
    setSelectedKrs
}) => {
    
    const userOptions = allUsers.map(u => ({ value: u.id, label: u.name }));
    const projectOptions = allProjects.map(p => ({ value: p.id, label: p.name }));
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
            <KRFilterButton
                activeOkrs={activeOkrs}
                selectedKrs={selectedKrs}
                setSelectedKrs={setSelectedKrs}
                placeholder="按KR筛选"
            />
        </div>
    );
};