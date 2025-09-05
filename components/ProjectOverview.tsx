import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, ProjectStatus, Priority, OKR } from '../types';
import { useFilterState } from '../context/FilterStateContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { KRFilterButton } from './KRFilterButton';
import { ProjectTable } from './ProjectTable';

type SortField = 'name' | 'status' | 'priority' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ProjectOverviewProps {
  projects: Project[];
  activeOkrs: OKR[];
  allUsers: any[];
  currentUser: any;
  editingId: string | null;
  onCreateProject: () => void;
  onSaveNewProject: (project: Project) => void;
  onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
  onDeleteProject: (id: string) => void;
  onCancelNewProject: (id: string) => void;
  onOpenModal: (type: 'role' | 'comments' | 'changelog' | 'edit', projectId: string, details?: any) => void;
  onToggleFollow: (projectId: string) => void;
  onAddComment: (projectId: string, text: string) => void;
  onEditProject?: (project: Project) => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ 
  projects, 
  activeOkrs, 
  allUsers, 
  currentUser, 
  editingId,
  onCreateProject,
  onSaveNewProject,
  onUpdateProject,
  onDeleteProject,
  onCancelNewProject,
  onOpenModal,
  onToggleFollow,
  onAddComment,
  onEditProject 
}) => {
  // 使用新的状态管理系统
  const { state, updateProjectOverviewFilters } = useFilterState();
  const filters = state.projectOverview;

  // 本地状态处理函数
  const setSearchTerm = (value: string) => updateProjectOverviewFilters({ searchTerm: value });
  const setSelectedStatuses = (value: string[]) => updateProjectOverviewFilters({ selectedStatuses: value });
  const setSelectedPriorities = (value: string[]) => updateProjectOverviewFilters({ selectedPriorities: value });
  const setSelectedParticipants = (value: string[]) => updateProjectOverviewFilters({ selectedParticipants: value });
  const setSelectedKrs = (value: string[]) => updateProjectOverviewFilters({ selectedKrs: value });

  // 从状态中获取当前值
  const searchTerm = filters.searchTerm;
  const selectedStatuses = filters.selectedStatuses || [];
  const selectedPriorities = filters.selectedPriorities || [];
  const selectedParticipants = filters.selectedParticipants || [];
  const selectedKrs = filters.selectedKrs || [];

  // 排序状态
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });

  // 排序函数
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 筛选和排序项目
  const filteredAndSortedProjects = useMemo(() => {
    // 首先筛选项目
    const filtered = projects.filter(project => {
      // 新建的项目（处于编辑状态）始终显示，不受筛选条件影响
      if (editingId && project.id === editingId) {
        return true;
      }
      
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.businessProblem || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(project.status);
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(project.priority);
      const matchesParticipant = selectedParticipants.length === 0 || selectedParticipants.some(participantId => {
        const roles = ['productManagers', 'backendDevelopers', 'frontendDevelopers', 'qaTesters'];
        return roles.some(role => 
          (project[role as keyof Project] as any[] || []).some((member: any) => member.userId === participantId)
        );
      });
      const matchesKr = selectedKrs.length === 0 || 
                       (project.keyResultIds || []).some(krId => selectedKrs.includes(krId));
      
      return matchesSearch && matchesStatus && matchesPriority && matchesParticipant && matchesKr;
    });

    // 然后排序项目
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status, 'zh-CN');
          break;
        case 'priority':
          // 优先级排序：部门OKR > 个人OKR > 临时重要需求 > 不重要的需求
          const priorityOrder = { '部门OKR': 0, '个人OKR': 1, '临时重要需求': 2, '不重要的需求': 3 };
          const aOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
          const bOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
          comparison = aOrder - bOrder;
          break;
        case 'createdAt':
        default:
          // 按创建时间排序，使用proposedDate作为创建时间
          const aTime = a.proposedDate ? new Date(a.proposedDate).getTime() : 0;
          const bTime = b.proposedDate ? new Date(b.proposedDate).getTime() : 0;
          comparison = bTime - aTime; // 默认倒序（最新的在前）
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [projects, searchTerm, selectedStatuses, selectedPriorities, selectedParticipants, selectedKrs, editingId, sortConfig]);

  // 准备筛选选项
  const statusOptions = Object.values(ProjectStatus).map(status => ({ value: status, label: status }));
  const priorityOptions = Object.values(Priority).map(priority => ({ value: priority, label: priority }));
  const participantOptions = (allUsers || []).map(user => ({ value: user.id, label: user.name }));

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* 固定的搜索和筛选栏 */}
      <div className="flex-shrink-0 p-4 md:p-6 lg:p-8 pb-0">
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* 搜索框 - 缩短至六分之一宽度 */}
            <div className="w-full lg:w-1/6">
              <input
                type="text"
                placeholder="搜索项目名称、描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#4a4a4a] rounded-md bg-white dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 筛选器 */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <MultiSelectDropdown
                options={statusOptions}
                selectedValues={selectedStatuses}
                onSelectionChange={setSelectedStatuses}
                placeholder="状态"
              />
              <MultiSelectDropdown
                options={priorityOptions}
                selectedValues={selectedPriorities}
                onSelectionChange={setSelectedPriorities}
                placeholder="优先级"
              />
              <MultiSelectDropdown
                options={participantOptions}
                selectedValues={selectedParticipants}
                onSelectionChange={setSelectedParticipants}
                placeholder="参与人"
              />
              <KRFilterButton
                activeOkrs={activeOkrs}
                selectedKrs={selectedKrs}
                setSelectedKrs={setSelectedKrs}
                placeholder="按KR筛选"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 overflow-hidden">
        <ProjectTable
          projects={filteredAndSortedProjects}
          allUsers={allUsers}
          activeOkrs={activeOkrs}
          currentUser={currentUser}
          editingId={editingId}
          onSaveNewProject={onSaveNewProject}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onCancelNewProject={onCancelNewProject}
          onOpenModal={onOpenModal}
          onToggleFollow={onToggleFollow}
          onCreateProject={onCreateProject}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>
    </main>
  );
};

export default ProjectOverview;