import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { OKRPage } from './components/OKRPage';
import { KanbanView } from './components/KanbanView';
import { PersonalView } from './components/PersonalView';
import ProjectOverview from './components/ProjectOverview';
import { WeeklyMeetingView } from './components/WeeklyMeetingView';

import { LoadingSpinner } from './components/LoadingSpinner';
import { RoleEditModal } from './components/RoleEditModal';
import { CommentModal } from './components/CommentModal';
import { ChangeLogModal } from './components/ChangeLogModal';
import { api } from './api.ts';
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
        // 为"最后一次测试"项目添加陈雨的测试评论
        console.log('开始检查项目和用户数据...');
        console.log('项目数量:', fetchedProjects.length);
        console.log('用户数量:', fetchedUsers.length);
        console.log('所有项目名称:', fetchedProjects.map(p => p.name));
        console.log('所有用户名称:', fetchedUsers.map(u => u.name));
        
        if (fetchedProjects.length > 0 && fetchedUsers.length > 0) {
            const testProject = fetchedProjects.find(p => p.name === '最后一次测试');
            const chenYuUser = fetchedUsers.find(u => u.name === '陈雨');
            
            console.log('找到的测试项目:', testProject ? testProject.name : '未找到');
            console.log('找到的陈雨用户:', chenYuUser ? chenYuUser.name : '未找到');
            console.log('当前用户:', currentUser.name);
            
            if (testProject) {
                console.log('测试项目现有评论数量:', testProject.comments ? testProject.comments.length : 0);
            }
            
            if (testProject && chenYuUser) {
                // 清空现有评论，添加陈雨的评论
                const testComments = [
                    {
                        id: 'chenyu_comment_1',
                        userId: chenYuUser.id,
                        text: '这个项目的测试用例我已经review过了，整体质量不错，建议再补充一些边界条件的测试。',
                        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3小时前
                        mentions: [],
                        readBy: [chenYuUser.id]
                    },
                    {
                        id: 'chenyu_comment_2',
                        userId: chenYuUser.id,
                        text: '另外，我觉得性能测试这块还需要加强一下，特别是并发场景下的表现。',
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小时前
                        mentions: [],
                        readBy: [chenYuUser.id]
                    }
                ];
                
                testProject.comments = testComments;
                console.log(`✅ 已为"${testProject.name}"项目添加陈雨的评论，评论数量:`, testProject.comments.length);
            } else {
                console.log('❌ 未添加测试评论，原因:');
                if (!testProject) console.log('- 未找到"最后一次测试"项目');
                if (!chenYuUser) console.log('- 未找到"陈雨"用户');
            }
        }
        
        setProjects(fetchedProjects);
        setOkrSets(fetchedOkrSets);
        
        // 检查项目数据中的KR关联
        console.log('🔧 App - Setting projects, checking KR associations:');
        if (fetchedProjects && fetchedProjects.length > 0) {
            fetchedProjects.forEach(project => {
                if (project.keyResultIds && project.keyResultIds.length > 0) {
                    console.log('🔧 App - Project with KRs:', {
                        projectId: project.id,
                        projectName: project.name,
                        keyResultIds: project.keyResultIds,
                        keyResultCount: project.keyResultIds.length
                    });
                }
            });
        }
        
        // 检查OKR数据
        console.log('🔧 App - Setting OKRs:');
        if (fetchedOkrSets && fetchedOkrSets.length > 0) {
            fetchedOkrSets.forEach(okrSet => {
                console.log('🔧 App - OKR Set:', {
                    periodId: okrSet.periodId,
                    okrCount: okrSet.okrs?.length || 0
                });
                okrSet.okrs?.forEach((okr, okrIndex) => {
                    console.log('🔧 App - OKR:', {
                        okrIndex: okrIndex + 1,
                        okrId: okr.id,
                        objective: okr.objective,
                        krCount: okr.keyResults?.length || 0
                    });
                    okr.keyResults?.forEach((kr, krIndex) => {
                        console.log('🔧 App - KR:', {
                            okrIndex: okrIndex + 1,
                            krIndex: krIndex + 1,
                            krId: kr.id,
                            description: kr.description
                        });
                    });
                });
            });
        }
        
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
        const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
      name: '',
      priority: Priority.LowPriority,
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
      createdAt: new Date().toISOString(),
      isNew: true,
    };
    
    // 清除之前的新项目，确保只有一个新项目
    setProjects(prev => {
      const existingProjects = prev.filter(p => !p.isNew);
      return [newProject, ...existingProjects];
    });
    setEditingId(newProject.id);
    
    // 立即滚动到表格顶部，确保新建项目可见
    requestAnimationFrame(() => {
      const tableContainer = document.querySelector('[data-table-container]');
      if (tableContainer) {
        tableContainer.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
  }, []);

  const handleUpdateProject = useCallback(async (projectId: string, field: keyof Project, value: any) => {
    const projectToUpdate = (projects || []).find(p => p.id === projectId);
    if (!projectToUpdate) return;
    
    // 优化的值比较逻辑，避免昂贵的JSON.stringify
    const oldValue = projectToUpdate[field];
    const hasChanged = (() => {
      // 对于基本类型，直接比较
      if (typeof oldValue !== 'object' || oldValue === null || typeof value !== 'object' || value === null) {
        return oldValue !== value;
      }
      
      // 对于数组，比较长度和内容
      if (Array.isArray(oldValue) && Array.isArray(value)) {
        if (oldValue.length !== value.length) return true;
        return oldValue.some((item, index) => JSON.stringify(item) !== JSON.stringify(value[index]));
      }
      
      // 对于其他对象，使用JSON.stringify作为后备
      return JSON.stringify(oldValue) !== JSON.stringify(value);
    })();
    
    if (!hasChanged) {
      return; // Do nothing if value hasn't changed.
    }
    
    // 移除KR关联校验限制


    // For new projects, just update local state.
    if (projectToUpdate.isNew) {
        console.log('🔧 App - Updating new project local state:', { projectId, field, value });
        const updatedProject = { ...projectToUpdate, [field]: value };
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        return;
    }

    // Optimistic Update for existing projects
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
            
            const roleDetails = roleValue.map(member => {
                const user = (allUsers || []).find(u => u.id === member.userId);
                const userName = user ? user.name : '未知用户';
                
                // 包含排期信息 - 优先显示 timeSlots 中的排期
                if (member.timeSlots && member.timeSlots.length > 0) {
                    const slot = member.timeSlots[0];
                    if (slot.startDate && slot.endDate) {
                        const startDateObj = new Date(slot.startDate);
                        const endDateObj = new Date(slot.endDate);
                        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                            const startDate = startDateObj.toLocaleDateString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit'
                            }).replace(/\//g, '.');
                            const endDate = endDateObj.toLocaleDateString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit'
                            }).replace(/\//g, '.');
                            return `${userName}(${startDate}~${endDate})`;
                        } else {
                            return `${userName}(无排期)`;
                        }
                    } else {
                        return `${userName}(无排期)`;
                    }
                } else if (member.startDate && member.endDate) {
                    const startDateObj = new Date(member.startDate);
                    const endDateObj = new Date(member.endDate);
                    if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                        return `${userName}(${member.startDate}~${member.endDate})`;
                    } else {
                        return `${userName}(无排期)`;
                    }
                } else if (member.startDate) {
                    const startDateObj = new Date(member.startDate);
                    if (!isNaN(startDateObj.getTime())) {
                        return `${userName}(${member.startDate}开始)`;
                    } else {
                        return `${userName}(无排期)`;
                    }
                } else {
                    return `${userName}(无排期)`;
                }
            });
            
            return roleDetails.length > 0 ? roleDetails.join(', ') : '无';
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
        updates.changeLog = [newLogEntry, ...(projectToUpdate.changeLog || [])];
    }

    // Optimistically update local state for a responsive UI.
    setProjects(prevProjects => 
        prevProjects.map(p => 
            p.id === projectId ? { ...p, ...updates } : p
        )
    );
    
    // Asynchronously call the API without blocking UI.
    try {
        console.log('🔧 App - Updating project via API:', { projectId, field, value });
        if (field === 'keyResultIds') {
            console.log('🔧 App - KR update details:', { 
                oldKRs: projectToUpdate.keyResultIds,
                newKRs: value,
                isArray: Array.isArray(value),
                dataBeingSet: JSON.stringify(value)
            });
            console.log('🔧 App - Updates object being sent to API:', updates);
        }
        const result = await api.updateProject(projectId, updates);
        console.log('🔧 App - Project update successful, API response:', result);
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
    try {
        // 获取当前本地状态中的项目数据，确保包含所有用户修改
        const currentProjectState = projects.find(p => p.id === projectToSave.id);
        const finalProjectData = currentProjectState || projectToSave;

        const creationLogEntry: ChangeLogEntry = {
            id: `cl_${Date.now()}`,
            userId: currentUser!.id,
            field: '项目创建',
            oldValue: '',
            newValue: finalProjectData.name,
            changedAt: new Date().toISOString(),
        };
        const projectWithLog = { 
            ...finalProjectData, 
            changeLog: [creationLogEntry, ...(finalProjectData.changeLog || [])],
            isNew: undefined // 移除 isNew 标记
        };

        await api.createProject(projectWithLog);
        await fetchData();
        // 确保在数据刷新后清除编辑状态
        setEditingId(null);
    } catch (error) {
        console.error("Failed to save new project", error);
        // 如果保存失败，也要清除编辑状态
        setEditingId(null);
    } finally {
        setIsLoading(false);
    }
  }, [fetchData, currentUser, projects]);
  
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

  const handleEditProject = useCallback((project: Project) => {
    // 打开编辑模态框或设置编辑状态
    handleOpenModal('edit', project.id);
  }, []);

  const handleOpenModal = useCallback((type: ModalType, projectId: string, details: Omit<ModalState, 'isOpen' | 'type' | 'projectId'> = {}) => {
    setModalState({ isOpen: true, type, projectId, ...details });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false });
  }, []);
  
  const handleSaveRole = useCallback(async (projectId: string, roleKey: ProjectRoleKey, newRole: Role) => {
     handleCloseModal();
     
     // 检查是否为新项目
     const projectToUpdate = (projects || []).find(p => p.id === projectId);
     if (projectToUpdate?.isNew) {
       // 对于新项目，只更新本地状态，不调用 API
       setProjects(prev => prev.map(p => 
         p.id === projectId ? { ...p, [roleKey]: newRole } : p
       ));
       return;
     }
     
     // 对于现有项目，正常调用 handleUpdateProject
     await handleUpdateProject(projectId, roleKey, newRole);
  }, [handleUpdateProject, handleCloseModal, projects]);

  const handleUpdateCurrentOkrSet = async (updatedOkrs: OKR[]) => {
    if (!currentOkrPeriodId) return;
    const currentSet = (okrSets || []).find(s => s.periodId === currentOkrPeriodId);
    if (!currentSet) return;

    setIsLoading(true);
    try {
        const updatedSet = { ...currentSet, okrs: updatedOkrs };
        await api.updateOkrSet(currentOkrPeriodId, updatedSet);
        await fetchData();
    } catch (error) {
        console.error("Failed to update OKR set", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateNewOkrPeriod = async () => {
    // 筛选正常格式的周期（YYYY-HN格式）并找到最新的
    const validPeriods = okrSets.filter(set => {
        return set.periodId && set.periodId.match(/^\d{4}-H[12]$/);
    });
    
    if (validPeriods.length === 0) {
        console.error("No valid periods found. Cannot create new period.");
        alert("未找到有效的OKR周期，无法创建新周期。");
        return;
    }
    
    // 按年份和半年排序找到最新的周期
    const latestPeriod = validPeriods.sort((a, b) => {
        const [yearA, halfA] = a.periodId.split('-H').map(Number);
        const [yearB, halfB] = b.periodId.split('-H').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return halfB - halfA;
    })[0];

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
    
    // 检查新周期是否已存在
    const existingPeriod = okrSets.find(set => set.periodId === nextPeriodId);
    if (existingPeriod) {
        alert(`周期 ${nextPeriodName} 已存在，无法创建重复周期。`);
        return;
    }

    setIsLoading(true);
    try {
        const newSet = await api.createOkrSet({ periodId: nextPeriodId, periodName: nextPeriodName });
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
    
    const followers = project.followers || [];
    const isFollowing = followers.includes(currentUser.id);
    const newFollowers = isFollowing
        ? followers.filter(id => id !== currentUser.id)
        : [...followers, currentUser.id];
    
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
        return (
          <KanbanView 
            projects={projects} 
            allUsers={allUsers} 
            activeOkrs={activeOkrs} 
            onUpdateProject={handleUpdateProject}
            onOpenRoleModal={(roleKey, roleName) => handleOpenModal('role', '', { roleKey, roleName })}
            onToggleFollow={handleToggleFollow}
            currentUser={currentUser}
          />
        );
      case 'weekly':
        return (
            <WeeklyMeetingView
                projects={projects}
                allUsers={allUsers}
                activeOkrs={activeOkrs}
                onOpenModal={handleOpenModal}
                onUpdateProject={handleUpdateProject}
            />
        );

      case 'overview':
        return (
          <ProjectOverview
            projects={projects}
            activeOkrs={activeOkrs}
            allUsers={allUsers}
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
            onEditProject={handleEditProject}
          />
        );
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