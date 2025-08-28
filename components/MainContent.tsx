import React, { useState, useMemo } from 'react';
import { ProjectTable } from './ProjectTable';
import { FilterBar } from './FilterBar';
import { Project, ProjectStatus, Role, User, ProjectRoleKey, OKR, Priority } from '../types';
import { fuzzySearch } from '../utils';
import { IconPlus } from './Icons';


interface MainContentProps {
  projects: Project[];
  allUsers: User[];
  activeOkrs: OKR[];
  currentUser: User;
  editingId: string | null;
  onCreateProject: () => void;
  onSaveNewProject: (project: Project) => void;
  onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
  onDeleteProject: (id: string) => void;
  onCancelNewProject: (id: string) => void;
  onOpenModal: (type: 'role' | 'comments' | 'changelog', projectId: string, details?: any) => void;
  onToggleFollow: (projectId: string) => void;
  onAddComment: (projectId: string, text: string) => void;
}


export const MainContent: React.FC<MainContentProps> = (props) => {
  const {
    projects, allUsers, activeOkrs, currentUser, editingId, onCreateProject, onSaveNewProject,
    onUpdateProject, onDeleteProject, onCancelNewProject, onOpenModal, onToggleFollow, onAddComment
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedPMs, setSelectedPMs] = useState<string[]>([]);
  const [selectedBEs, setSelectedBEs] = useState<string[]>([]);
  const [selectedFEs, setSelectedFEs] = useState<string[]>([]);
  const [selectedQAs, setSelectedQAs] = useState<string[]>([]);
  const [selectedKrs, setSelectedKrs] = useState<string[]>([]);

  const keyResultToOkrMap = useMemo(() => {
    const map = new Map<string, string>();
    activeOkrs.forEach(okr => {
        okr.keyResults.forEach(kr => {
            map.set(kr.id, okr.id);
        });
    });
    return map;
  }, [activeOkrs]);

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter(project => {
        // 确保项目数据完整性
        if (!project || !project.name) {
            return false;
        }

        // Search Term
        if (searchTerm && searchTerm.trim() && !fuzzySearch(searchTerm.trim(), project.name)) {
            return false;
        }
        
        // Status
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(project.status)) {
            return false;
        }
        
        // Priority
        if (selectedPriorities.length > 0 && !selectedPriorities.includes(project.priority)) {
            return false;
        }
        
        // PMs - 确保数组存在且不为空
        if (selectedPMs.length > 0) {
            const productManagers = project.productManagers || [];
            if (!productManagers.some(m => m && m.userId && selectedPMs.includes(m.userId))) {
                return false;
            }
        }
        
        // BEs - 确保数组存在且不为空
        if (selectedBEs.length > 0) {
            const backendDevelopers = project.backendDevelopers || [];
            if (!backendDevelopers.some(m => m && m.userId && selectedBEs.includes(m.userId))) {
                return false;
            }
        }
        
        // FEs - 确保数组存在且不为空
        if (selectedFEs.length > 0) {
            const frontendDevelopers = project.frontendDevelopers || [];
            if (!frontendDevelopers.some(m => m && m.userId && selectedFEs.includes(m.userId))) {
                return false;
            }
        }
        
        // QAs - 确保数组存在且不为空
        if (selectedQAs.length > 0) {
            const qaTesters = project.qaTesters || [];
            if (!qaTesters.some(m => m && m.userId && selectedQAs.includes(m.userId))) {
                return false;
            }
        }
        
        // KRs - 确保数组存在且不为空
        if (selectedKrs.length > 0) {
            const keyResultIds = project.keyResultIds || [];
            const selectedKrSet = new Set(selectedKrs);
            if (!keyResultIds.some(krId => krId && selectedKrSet.has(krId))) {
                return false;
            }
        }
        
        return true;
    });

    const priorityOrder: Record<Priority, number> = {
        [Priority.DeptOKR]: 0,
        [Priority.CompanyOKR]: 1,
        [Priority.BusinessRequirement]: 2,
        [Priority.TechOptimization]: 3,
    };

    const statusOrder: Record<ProjectStatus, number> = {
        [ProjectStatus.NotStarted]: 0,
        [ProjectStatus.Discussion]: 1,
        [ProjectStatus.ProductDesign]: 2,
        [ProjectStatus.RequirementsDone]: 3,
        [ProjectStatus.ReviewDone]: 4,
        [ProjectStatus.InProgress]: 5,
        [ProjectStatus.DevDone]: 6,
        [ProjectStatus.Testing]: 7,
        [ProjectStatus.TestDone]: 8,
        [ProjectStatus.Launched]: 9,
        [ProjectStatus.Paused]: 10,
    };
    
    return filtered.sort((a, b) => {
        // 新项目始终排在最前面
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        
        const priorityA = priorityOrder[a.priority];
        const priorityB = priorityOrder[b.priority];
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        const getOkrId = (project: Project) => {
            const keyResultIds = project.keyResultIds || [];
            if (keyResultIds.length > 0) {
                return keyResultToOkrMap.get(keyResultIds[0]) || 'zzzz';
            }
            return 'zzzz';
        };

        const okrA = getOkrId(a);
        const okrB = getOkrId(b);

        if (okrA.localeCompare(okrB) !== 0) {
            return okrA.localeCompare(okrB);
        }

        const statusA = statusOrder[a.status];
        const statusB = statusOrder[b.status];
        return statusA - statusB;
    });

  }, [projects, searchTerm, selectedStatuses, selectedPriorities, selectedPMs, selectedBEs, selectedFEs, selectedQAs, selectedKrs, keyResultToOkrMap]);
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto flex flex-col gap-6">
        <FilterBar
          allUsers={allUsers}
          activeOkrs={activeOkrs}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          selectedPriorities={selectedPriorities}
          setSelectedPriorities={setSelectedPriorities}
          selectedPMs={selectedPMs}
          setSelectedPMs={setSelectedPMs}
          selectedBEs={selectedBEs}
          setSelectedBEs={setSelectedBEs}
          selectedFEs={selectedFEs}
          setSelectedFEs={setSelectedFEs}
          selectedQAs={selectedQAs}
          setSelectedQAs={setSelectedQAs}
          selectedKrs={selectedKrs}
          setSelectedKrs={setSelectedKrs}
        />
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
        />
      </div>
    </main>
  );
};