import React from 'react';
import { User, ProjectStatus, OKR, Priority } from '../types';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { KRFilterButton } from './KRFilterButton';

interface WeeklyMeetingFilterBarProps {
    allUsers: User[];
    activeOkrs: OKR[];
    
    selectedPriorities: string[];
    setSelectedPriorities: (values: string[]) => void;
    
    selectedKrIds: string[];
    setSelectedKrIds: (values: string[]) => void;

    selectedParticipantIds: string[];
    setSelectedParticipantIds: (values: string[]) => void;
    
    selectedStatuses: string[];
    setSelectedStatuses: (values: string[]) => void;
}

export const WeeklyMeetingFilterBar: React.FC<WeeklyMeetingFilterBarProps> = ({
    allUsers,
    activeOkrs,
    selectedPriorities,
    setSelectedPriorities,
    selectedKrIds,
    setSelectedKrIds,
    selectedParticipantIds,
    setSelectedParticipantIds,
    selectedStatuses,
    setSelectedStatuses
}) => {
    
    const priorityOptions = Object.values(Priority).map(p => ({ value: p, label: p }));
    
    const participantOptions = allUsers
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        .map(u => ({ value: u.id, label: u.name }));
    
    const statusOptions = [
        ProjectStatus.NotStarted,
        ProjectStatus.Discussion,
        ProjectStatus.ProductDesign,
        ProjectStatus.RequirementsDone,
        ProjectStatus.ReviewDone,
        ProjectStatus.InProgress,
        ProjectStatus.ProjectInProgress,
        ProjectStatus.DevDone,
        ProjectStatus.Testing,
        ProjectStatus.TestDone,
        ProjectStatus.LaunchedThisWeek,
        ProjectStatus.Completed,
        ProjectStatus.Paused,
    ].map(s => ({ value: s, label: s }));
    
    return (
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl p-4 flex flex-wrap items-center gap-4 mb-6">
            <MultiSelectDropdown
                options={priorityOptions}
                selectedValues={selectedPriorities}
                onSelectionChange={setSelectedPriorities}
                placeholder="优先级"
            />
            <KRFilterButton
                activeOkrs={activeOkrs}
                selectedKrs={selectedKrIds}
                setSelectedKrs={setSelectedKrIds}
                placeholder="按KR筛选"
            />
            <MultiSelectDropdown
                options={participantOptions}
                selectedValues={selectedParticipantIds}
                onSelectionChange={setSelectedParticipantIds}
                placeholder="参与人"
            />
            <MultiSelectDropdown
                options={statusOptions}
                selectedValues={selectedStatuses}
                onSelectionChange={setSelectedStatuses}
                placeholder="状态"
            />
        </div>
    );
};