import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { OKRPage } from './components/OKRPage';
import { KanbanView } from './components/KanbanView';
import { PersonalView } from './components/PersonalView';
import { WeeklyMeetingView } from './components/WeeklyMeetingView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { RoleEditModal } from './components/RoleEditModal';
import { CommentModal } from './components/CommentModal';
import { ChangeLogModal } from './components/ChangeLogModal';
import { api } from './api';
import { Project, ProjectStatus, Role, User, ProjectRoleKey, OKR, Priority, Comment, ChangeLogEntry, OkrSet } from './types';

export type ViewType = 'overview' | 'okr' | 'kanban' | 'personal' | 'weekly';

// 根据当前日期确定应该显示的OKR周期
const getCurrentOkrPeriod = (okrSets: OkrSet[]): OkrSet => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  
  // 确定当前是上半年还是下半年
  const isFirstHalf = currentMonth <= 6;
  const expectedPeriodId = `${currentYear}-${isFirstHalf ? 'H1' : 'H2'}`;
  
  // 查找当前期间的OKR
  const currentPeriod = (okrSets || []).find(set => set.periodId === expectedPeriodId);
  if (currentPeriod) {
    return currentPeriod;
  }
  
  // 如果当前期间不存在，查找最近的期间
  const sortedSets = [...okrSets].sort((a, b) => {
    // 解析periodId，例如 "2025-H1" -> {year: 2025, half: 1}
    const parseId = (id: string) => {
      const [year, half] = id.split('-');
      return { year: parseInt(year), half: half === 'H1' ? 1 : 2 };
    };
    
    const aData = parseId(a.periodId);
    const bData = parseId(b.periodId);
    
    if (aData.year !== bData.year) {
      return bData.year - aData.year; // 年份降序
    }
    return bData.half - aData.half; // 半年降序
  });
  
  // 返回最新的OKR周期
  return sortedSets[0];
};

type ModalType = 'role' | 'comments' | 'changelog';
type ModalState = {
  isOpen: boolean;
  type?: ModalType;
  projectId?: string;
  roleKey?: ProjectRoleKey;
  roleName?: string;
  replyToUser?: User;
}

interface AppProps {
  currentUser: User;
}

const App: React.FC<AppProps> = ({ currentUser }) => {
  const [view, setView] = useState<ViewType>('personal');
  const [projects, setProjects] = useState<Project[]>([]);
  const [okrSets, setOkrSets] = useState<OkrSet[]>([]);
  const [currentOkrPeriodId, setCurrentOkrPeriodId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedProjects, fetchedOkrSets, fetchedUsers] = await Promise.all([
            api.fetchProjects(),
            api.fetchOkrSets(),
            api.fetchUsers()
        ]);
        setProjects(fetchedProjects);
        setOkrSets(fetchedOkrSets);
        
        if (fetchedOkrSets.length > 0) {
            if (!currentOkrPeriodId || !(fetchedOkrSets || []).find(s => s.periodId === currentOkrPeriodId)) {
                const currentPeriod = getCurrentOkrPeriod(fetchedOkrSets);
                setCurrentOkrPeriodId(currentPeriod.periodId);
            }
        }

        setAllUsers(fetchedUsers);
    } catch (error) {
        console.error("Failed to fetch initial data", error);
        // Here you could set an error state and show a message to the user
    } finally {
        setIsLoading(false);
    }
  }, [currentOkrPeriodId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect for handling the weekly update rollover
  useEffect(() => {
    const handleWeeklyRollover = async () => {
        const today = new Date();
        // In JavaScript, getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
        const isMonday = today.getDay() === 1;

        if (!isMonday) {
            return;
        }

        const lastRolloverDate = localStorage.getItem('lastWeeklyRolloverDate');
        const todayDateString = today.toISOString().split('T')[0];

        if (lastRolloverDate === todayDateString) {
            return; // Rollover already performed today
        }

        console.log("It's Monday! Performing weekly update rollover...");
        setIsLoading(true);
        try {
            await api.performWeeklyRollover();
            localStorage.setItem('lastWeeklyRolloverDate', todayDateString);
            await fetchData(); // Refetch data to show the changes
        } catch (error) {
            console.error("Failed to perform weekly rollover", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Run this check only after the initial data has loaded
    if (!isLoading) {
        handleWeeklyRollover();
    }
  }, [isLoading, fetchData]);

  const activeOkrs = useMemo(() => {
    if (!currentOkrPeriodId) return [];
    return (okrSets || []).find(s => s.periodId === currentOkrPeriodId)?.okrs || [];
  }, [okrSets, currentOkrPeriodId]);

  const handleCreateProject = useCallback(() => {
    const newProject: Project = {
      id: `new_${Date.now()}`,
      name: '新项目 - 点击编辑',
      priority: Priority.TechOptimization,
      status: ProjectStatus.NotStarted,
      businessProblem: '',
      keyResultIds: [],
      weeklyUpdate: '',
      lastWeekUpdate: '',
      productManagers: [],
      backendDevelopers: [],
      frontendDevelopers: [],
      qaTesters: [],
      proposedDate: null,
      launchDate: null,
      followers: [],
      comments: [],
      changeLog: [],
      isNew: true,
    };
    setProjects(prev => [newProject, ...prev]);
    setEditingId(newProject.id);
  }, []);

  const handleUpdateProject = useCallback(async (projectId: string, field: keyof Project, value: any) => {
    const projectToUpdate = (projects || []).find(p => p.id === projectId);
    if (!projectToUpdate) return;
    
    if (JSON.stringify(projectToUpdate[field]) === JSON.stringify(value)) {
        return; // Do nothing if value hasn't changed.
    }
    
    // 移除KR关联校验限制


    // For new projects, just update local state.
    if (projectToUpdate.isNew) {
        const updatedProject = { ...projectToUpdate, [field]: value };
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        return;
    }

    // Optimistic Update for existing projects
    const oldValue = projectToUpdate[field];
    const updates: Partial<Project> = { [field]: value };
    
    const loggableFieldLabels: { [K in keyof Project]?: string } = {
        name: '项目名称',
        priority: '优先级',
        status: '状态',
        weeklyUpdate: '本周进展/问题',
        productManagers: '产品经理',
        backendDevelopers: '后端研发',
        frontendDevelopers: '前端研发',
        qaTesters: '测试',
        launchDate: '上线时间',
    };

    const labelForLog = loggableFieldLabels[field];

    if (labelForLog) {
        // 格式化角色字段的显示值
        const formatRoleValue = (roleValue: any): string => {
            if (!Array.isArray(roleValue)) return String(roleValue);
            
            const roleNames = roleValue.map(member => {
                const user = (allUsers || []).find(u => u.id === member.userId);
                return user ? user.name : '未知用户';
            });
            
            return roleNames.length > 0 ? roleNames.join(', ') : '无';
        };

        const formatValue = (val: any): string => {
            if (typeof val === 'object' && Array.isArray(val)) {
                // 处理角色数组
                return formatRoleValue(val);
            }
            return String(val);
        };

        const newLogEntry: ChangeLogEntry = {
            id: `cl_${Date.now()}`,
            userId: currentUser!.id,
            field: labelForLog,
            oldValue: formatValue(oldValue),
            newValue: formatValue(value),
            changedAt: new Date().toISOString(),
        };
        updates.changeLog = [newLogEntry, ...projectToUpdate.changeLog];
    }

    // Optimistically update local state for a responsive UI.
    setProjects(prevProjects => 
        prevProjects.map(p => 
            p.id === projectId ? { ...p, ...updates } : p
        )
    );
    
    // Asynchronously call the API without blocking UI.
    try {
        await api.updateProject(projectId, updates);
        // On success, state is already updated. No full refresh needed.
    } catch (error) {
        console.error("Failed to update project", error);
        // On failure, alert user and revert to the source of truth.
        alert('项目更新失败，正在恢复数据...');
        await fetchData();
    }
  }, [projects, currentUser, fetchData]);

  const handleSaveNewProject = useCallback(async (projectToSave: Project) => {
    // 移除新项目的KR关联校验限制

    setIsLoading(true);
    setEditingId(null);
    try {
        const creationLogEntry: ChangeLogEntry = {
            id: `cl_${Date.now()}`,
            userId: currentUser!.id,
            field: '项目创建',
            oldValue: '',
            newValue: projectToSave.name,
            changedAt: new Date().toISOString(),
        };
        const projectWithLog = { ...projectToSave, changeLog: [creationLogEntry, ...projectToSave.changeLog] };

        await api.createProject(projectWithLog);
        await fetchData();
    } catch (error) {
        console.error("Failed to save new project", error);
    } finally {
        setIsLoading(false);
    }
  }, [fetchData, currentUser]);
  
  const handleCancelNewProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setEditingId(null);
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
        await api.deleteProject(projectId);
        await fetchData();
    } catch(error) {
        console.error("Failed to delete project", error);
    } finally {
        setIsLoading(false);
    }
  }, [fetchData]);

  const handleOpenModal = useCallback((type: ModalType, projectId: string, details: Omit<ModalState, 'isOpen' | 'type' | 'projectId'> = {}) => {
    setModalState({ isOpen: true, type, projectId, ...details });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false });
  }, []);
  
  const handleSaveRole = useCallback(async (projectId: string, roleKey: ProjectRoleKey, newRole: Role) => {
     handleCloseModal();
     await handleUpdateProject(projectId, roleKey, newRole);
  }, [handleUpdateProject, handleCloseModal]);

  const handleUpdateCurrentOkrSet = async (updatedOkrs: OKR[]) => {
    if (!currentOkrPeriodId) return;
    const currentSet = (okrSets || []).find(s => s.periodId === currentOkrPeriodId);
    if (!currentSet) return;

    setIsLoading(true);
    try {
        const updatedSet = { ...currentSet, okrs: updatedOkrs };
        await api.updateOkrSet(updatedSet);
        await fetchData();
    } catch (error) {
        console.error("Failed to update OKR set", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateNewOkrPeriod = async () => {
    const latestPeriod = okrSets.sort((a, b) => b.periodId.localeCompare(a.periodId))[0];
    if (!latestPeriod) {
        console.error("Cannot create new period without an existing one.");
        return;
    }

    const [yearStr, halfStr] = latestPeriod.periodId.split('-H');
    const year = parseInt(yearStr, 10);
    const half = parseInt(halfStr, 10);

    let nextYear = year;
    let nextHalf = half + 1;
    
    if (nextHalf > 2) {
        nextHalf = 1;
        nextYear++;
    }
    
    const nextPeriodId = `${nextYear}-H${nextHalf}`;
    const nextPeriodName = `${nextYear}年${nextHalf === 1 ? '上半年' : '下半年'}`;

    setIsLoading(true);
    try {
        const newSet = await api.createOkrSet(nextPeriodId, nextPeriodName);
        await fetchData();
        setCurrentOkrPeriodId(newSet.periodId);
    } catch(error) {
        console.error("Failed to create new OKR period", error);
        alert(`创建新周期失败: ${error}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleToggleFollow = useCallback(async (projectId: string) => {
    const project = (projects || []).find(p => p.id === projectId);
    if (!project || !currentUser) return;
    
    const isFollowing = project.followers.includes(currentUser.id);
    const newFollowers = isFollowing
        ? project.followers.filter(id => id !== currentUser.id)
        : [...project.followers, currentUser.id];
    
    await handleUpdateProject(projectId, 'followers', newFollowers);
  }, [projects, currentUser, handleUpdateProject]);

  const handleAddComment = useCallback(async (projectId: string, text: string, mentions: string[] = []) => {
      const project = (projects || []).find(p => p.id === projectId);
      if (!project || !currentUser) return;

      const newComment: Comment = {
          id: `c_${Date.now()}`,
          userId: currentUser.id,
          text,
          createdAt: new Date().toISOString(),
          mentions,
          readBy: [currentUser.id], // 作者自动标记为已读
      };
      
      const newComments = [...project.comments, newComment];
      await handleUpdateProject(projectId, 'comments', newComments);
      handleCloseModal();
  }, [projects, currentUser, handleUpdateProject, handleCloseModal]);

  const handleReply = useCallback((project: Project, userToReply: User) => {
      handleOpenModal('comments', project.id, { replyToUser: userToReply });
  }, [handleOpenModal]);
  
  const currentProjectForModal = (projects || []).find(p => p.id === modalState.projectId);

  const renderView = () => {
    switch (view) {
      case 'personal':
        return (
          <PersonalView
            projects={projects}
            allUsers={allUsers}
            activeOkrs={activeOkrs}
            currentUser={currentUser}
            onUpdateProject={handleUpdateProject}
            onOpenModal={handleOpenModal}
            onToggleFollow={handleToggleFollow}
            onReply={handleReply}
          />
        );
      case 'okr':
        return <OKRPage 
          okrSets={okrSets}
          currentPeriodId={currentOkrPeriodId}
          onPeriodChange={setCurrentOkrPeriodId}
          onUpdateOkrs={handleUpdateCurrentOkrSet}
          onCreateNewPeriod={handleCreateNewOkrPeriod}
        />;
      case 'kanban':
        return <KanbanView projects={projects} allUsers={allUsers} activeOkrs={activeOkrs} />;
      case 'weekly':
        return (
            <WeeklyMeetingView
                projects={projects}
                allUsers={allUsers}
                activeOkrs={activeOkrs}
                onOpenModal={handleOpenModal}
            />
        );
      case 'overview':
      default:
        return (
          <MainContent
            projects={projects}
            allUsers={allUsers}
            activeOkrs={activeOkrs}
            currentUser={currentUser}
            editingId={editingId}
            onCreateProject={handleCreateProject}
            onSaveNewProject={handleSaveNewProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onCancelNewProject={handleCancelNewProject}
            onOpenModal={handleOpenModal}
            onToggleFollow={handleToggleFollow}
            onAddComment={handleAddComment}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-300 font-sans">
      {isLoading && <LoadingSpinner />}
      <Sidebar view={view} setView={setView} currentUser={currentUser} />
      {renderView()}
      {modalState.isOpen && modalState.type === 'role' && currentProjectForModal && modalState.roleKey && modalState.roleName && (
        <RoleEditModal
            project={currentProjectForModal}
            roleKey={modalState.roleKey}
            roleName={modalState.roleName}
            allUsers={allUsers}
            onClose={handleCloseModal}
            onSave={handleSaveRole}
        />
      )}
      {modalState.isOpen && modalState.type === 'comments' && currentProjectForModal && (
        <CommentModal
          project={currentProjectForModal}
          allUsers={allUsers}
          currentUser={currentUser}
          onClose={handleCloseModal}
          onAddComment={handleAddComment}
          replyToUser={modalState.replyToUser}
        />
      )}
      {modalState.isOpen && modalState.type === 'changelog' && currentProjectForModal && (
          <ChangeLogModal
            project={currentProjectForModal}
            allUsers={allUsers}
            onClose={handleCloseModal}
          />
      )}
    </div>
  );
};

export default App;