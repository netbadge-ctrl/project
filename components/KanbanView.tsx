import React, { useMemo, useState, useCallback } from 'react';
import { Project, User, OKR } from '../types';
import { KanbanFilterBar } from './KanbanFilterBar';
import { KanbanTimelineControls } from './KanbanTimelineControls';
import { useFilterState } from '../context/FilterStateContext';

// --- Date Helper Functions ---

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const getStartOfMonth = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date: Date, weeks: number) => {
  return addDays(date, weeks * 7);
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
}

const diffDays = (date1: Date, date2: Date) => {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// --- Component ---

interface KanbanViewProps {
  projects: Project[];
  allUsers: User[];
  activeOkrs: OKR[];
}

const projectColors = [
  'bg-indigo-500', 'bg-rose-500', 'bg-amber-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-fuchsia-500',
  'bg-lime-500', 'bg-sky-500'
];

export const KanbanView: React.FC<KanbanViewProps> = ({ projects, allUsers, activeOkrs }) => {
  // 使用新的状态管理系统
  const { state, updateKanbanViewFilters } = useFilterState();
  const filters = state.kanbanView;

  // 本地状态处理函数
  const setSelectedUserIds = (value: string[]) => updateKanbanViewFilters({ selectedUserIds: value });
  const setSelectedProjectIds = (value: string[]) => updateKanbanViewFilters({ selectedProjectIds: value });
  const setSelectedKrIds = (value: string[]) => updateKanbanViewFilters({ selectedKrIds: value });
  const setSelectedStatuses = (value: string[]) => updateKanbanViewFilters({ selectedStatuses: value });
  const setSelectedPriorities = (value: string[]) => updateKanbanViewFilters({ selectedPriorities: value });
  const setGranularity = (value: 'week' | 'month') => updateKanbanViewFilters({ granularity: value });
  const setViewDate = (value: Date) => updateKanbanViewFilters({ viewDate: value.toISOString() });

  // 从状态中获取当前值
  const selectedUserIds = filters.selectedUserIds;
  const selectedProjectIds = filters.selectedProjectIds;
  const selectedKrIds = filters.selectedKrIds;
  const selectedStatuses = filters.selectedStatuses;
  const selectedPriorities = filters.selectedPriorities;
  const granularity = filters.granularity;
  const viewDate = new Date(filters.viewDate);


  const timeline = useMemo(() => {
    const headers: { label: string, days: number }[] = [];
    let startDate: Date, endDate: Date, rangeLabel: string;

    if (granularity === 'month') {
        const numMonths = 3;
        startDate = getStartOfMonth(viewDate);
        endDate = addDays(addMonths(startDate, numMonths), -1);

        const monthHeaders: Date[] = [];
        for (let i = 0; i < numMonths; i++) {
            const monthStart = addMonths(startDate, i);
            monthHeaders.push(monthStart);
            const nextMonthStart = addMonths(monthStart, 1);
            headers.push({
                label: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
                days: diffDays(monthStart, nextMonthStart)
            });
        }
        
        const endMonth = monthHeaders[numMonths-1];
        rangeLabel = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月 - ${endMonth.getFullYear()}年${endMonth.getMonth() + 1}月`;
    } else { // week
        const numWeeks = 3;
        startDate = getStartOfWeek(viewDate);
        endDate = addDays(addWeeks(startDate, numWeeks), -1);

        const formatDate = (d: Date) => `${d.getMonth()+1}月${d.getDate()}日`;
        
        for (let i = 0; i < numWeeks; i++) {
            const weekStart = addWeeks(startDate, i);
            headers.push({
                label: `W${getWeekNumber(weekStart)} (${formatDate(weekStart)})`,
                days: 7
            });
        }
        
        const endWeek = addWeeks(startDate, numWeeks - 1);
        rangeLabel = `${formatDate(startDate)} - ${formatDate(addDays(endWeek, 6))}`;
    }

    const totalDays = diffDays(startDate, endDate) + 1;

    return { startDate, endDate, totalDays, headers, rangeLabel };
  }, [granularity, viewDate]);

  const handleGranularityChange = useCallback((newGranularity: 'week' | 'month') => {
    setGranularity(newGranularity);
    setViewDate(new Date());
  }, []);

  const handlePrev = useCallback(() => {
    const newDate = granularity === 'month' ? addMonths(viewDate, -1) : addWeeks(viewDate, -1);
    setViewDate(newDate);
  }, [granularity, viewDate]);

  const handleNext = useCallback(() => {
    const newDate = granularity === 'month' ? addMonths(viewDate, 1) : addWeeks(viewDate, 1);
    setViewDate(newDate);
  }, [granularity, viewDate]);


  const userSchedules = useMemo(() => {
    let filteredProjects = projects || [];
    if (selectedKrIds.length > 0) {
        const krSet = new Set(selectedKrIds);
        filteredProjects = filteredProjects.filter(p => (p.keyResultIds || []).some(krId => krSet.has(krId)));
    }
    if (selectedProjectIds.length > 0) {
        const projectSet = new Set(selectedProjectIds);
        filteredProjects = filteredProjects.filter(p => projectSet.has(p.id));
    }
    if (selectedStatuses.length > 0) {
        const statusSet = new Set(selectedStatuses);
        filteredProjects = filteredProjects.filter(p => statusSet.has(p.status));
    }
    if (selectedPriorities.length > 0) {
        const prioritySet = new Set(selectedPriorities);
        filteredProjects = filteredProjects.filter(p => prioritySet.has(p.priority));
    }
    const relevantProjects = filteredProjects;

    let filteredUsers = allUsers || [];
    if (selectedUserIds.length > 0) {
        const userSet = new Set(selectedUserIds);
        filteredUsers = filteredUsers.filter(u => userSet.has(u.id));
    }
    
    if (selectedProjectIds.length > 0 || selectedKrIds.length > 0) {
        const assignedUserIds = new Set<string>();
        relevantProjects.forEach(p => {
            const roles: (keyof Project)[] = ['productManagers', 'backendDevelopers', 'frontendDevelopers', 'qaTesters'];
            roles.forEach(roleKey => {
                const team = (p[roleKey] as { userId: string }[]) || [];
                team.forEach(member => assignedUserIds.add(member.userId));
            });
        });
        filteredUsers = filteredUsers.filter(u => assignedUserIds.has(u.id));
    }
    
    const relevantUsers = filteredUsers;

    // 调试：检查用户数据是否包含部门信息
    console.log('KanbanView - 用户数据样本:', relevantUsers.slice(0, 3).map(u => ({
      name: u.name,
      deptId: u.deptId,
      deptName: u.deptName
    })));

    const sortedUsers = relevantUsers.sort((a, b) => {
      // 首先按部门名称排序
      const deptA = a.deptName || '未知部门';
      const deptB = b.deptName || '未知部门';
      if (deptA !== deptB) {
        return deptA.localeCompare(deptB, 'zh-CN');
      }
      // 同部门内按姓名排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    console.log('KanbanView - 排序后用户:', sortedUsers.slice(0, 5).map(u => ({
      name: u.name,
      deptName: u.deptName
    })));

    return sortedUsers.map(user => {
      const assignedProjects: { project: Project, role: string, startDate: string, endDate: string, description?: string }[] = [];
      relevantProjects.forEach(p => {
        const roles: (keyof Project)[] = ['productManagers', 'backendDevelopers', 'frontendDevelopers', 'qaTesters'];
        const roleNames: Record<string, string> = { productManagers: '产品', backendDevelopers: '后端', frontendDevelopers: '前端', qaTesters: '测试' };
        roles.forEach(roleKey => {
            const team = (p[roleKey] as any[]) || [];
            const member = team.find(m => m.userId === user.id);
            if (member) {
              // 支持新的多时段结构
              if (member.timeSlots && member.timeSlots.length > 0) {
                member.timeSlots.forEach((slot: any) => {
                  if (slot.startDate && slot.endDate) {
                    assignedProjects.push({ 
                      project: p, 
                      role: roleNames[roleKey], 
                      startDate: slot.startDate, 
                      endDate: slot.endDate,
                      description: slot.description 
                    });
                  }
                });
              }
              // 向后兼容旧的单时段结构
              else if (member.startDate && member.endDate) {
                assignedProjects.push({ project: p, role: roleNames[roleKey], startDate: member.startDate, endDate: member.endDate });
              }
            }
        });
      });

      const sortedSchedule = assignedProjects.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      const lanes: { endDate: Date }[] = [];
      const scheduleWithLanes = sortedSchedule.map(item => {
          const itemStartDate = new Date(item.startDate);
          let assignedLane = -1;

          for (let i = 0; i < lanes.length; i++) {
              if (itemStartDate > lanes[i].endDate) {
                  assignedLane = i;
                  lanes[i].endDate = new Date(item.endDate);
                  break;
              }
          }

          if (assignedLane === -1) {
              assignedLane = lanes.length;
              lanes.push({ endDate: new Date(item.endDate) });
          }
          
          return { ...item, lane: assignedLane };
      });
      
      return { ...user, schedule: scheduleWithLanes, maxLanes: lanes.length };
    });
  }, [projects, allUsers, selectedUserIds, selectedProjectIds, selectedKrIds, selectedStatuses, selectedPriorities]);


  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto flex flex-col gap-6">
        <KanbanFilterBar
            allUsers={allUsers}
            allProjects={projects}
            activeOkrs={activeOkrs}
            selectedUsers={selectedUserIds}
            setSelectedUsers={setSelectedUserIds}
            selectedProjects={selectedProjectIds}
            setSelectedProjects={setSelectedProjectIds}
            selectedKrs={selectedKrIds}
            setSelectedKrs={setSelectedKrIds}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
        />
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl flex-grow overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#232323] z-20">
              <KanbanTimelineControls 
                granularity={granularity}
                onGranularityChange={handleGranularityChange}
                onPrev={handlePrev}
                onNext={handleNext}
                rangeLabel={timeline.rangeLabel}
              />
              <div className="flex bg-gray-100 dark:bg-[#2a2a2a]">
                <div className="w-48 flex-shrink-0 p-3 font-semibold text-sm text-gray-900 dark:text-white border-r border-t border-gray-200 dark:border-[#363636]">
                  团队成员
                </div>
                <div className="flex-grow flex">
                  {timeline.headers.map((header, idx) => (
                    <div key={idx} style={{ width: `${(header.days / timeline.totalDays) * 100}%` }} className="p-3 text-center font-semibold text-sm text-gray-900 dark:text-white border-r border-t border-gray-200 dark:border-[#363636]">
                      {header.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="relative">
              {userSchedules.map((user) => (
                <div key={user.id} className="relative flex border-t border-gray-200 dark:border-[#363636] group hover:z-20">
                  <div className="w-48 flex-shrink-0 p-3 text-sm flex items-center border-r border-gray-200 dark:border-[#363636] bg-white dark:bg-[#232323] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] transition-colors duration-200">
                     <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                  <div className="flex-grow relative group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] transition-colors duration-200" style={{ minHeight: `${(user.maxLanes || 1) * 2.5}rem`}}>
                    {/* Background grid lines for headers */}
                    <div className="absolute inset-0 flex">
                      {timeline.headers.map((header, idx) => (
                        <div key={`grid-${idx}`} style={{ width: `${(header.days / timeline.totalDays) * 100}%` }} className="h-full border-r border-gray-200/70 dark:border-[#363636]/50"></div>
                      ))}
                    </div>

                    {/* Schedule Bars */}
                    <div className="absolute inset-0 py-1 z-10">
                      {user.schedule.map((item) => {
                        const itemStartDate = new Date(item.startDate);
                        const itemEndDate = new Date(item.endDate);

                        if (itemStartDate > timeline.endDate || itemEndDate < timeline.startDate) return null;

                        const clampedStartDate = itemStartDate < timeline.startDate ? timeline.startDate : itemStartDate;
                        const clampedEndDate = itemEndDate > timeline.endDate ? timeline.endDate : itemEndDate;
                        
                        const startOffsetDays = diffDays(timeline.startDate, clampedStartDate);
                        const durationDays = diffDays(clampedStartDate, clampedEndDate) + 1;

                        const left = (startOffsetDays / timeline.totalDays) * 100;
                        const width = (durationDays / timeline.totalDays) * 100;
                        const color = projectColors[(item.project.id.charCodeAt(1) || 0) % projectColors.length];

                        return (
                          <div
                            key={`${item.project.id}-${item.lane}-${item.startDate}-${item.endDate}`}
                            className={`absolute rounded-md ${color} px-2 flex items-center text-xs font-semibold text-white/90 tooltip-container group/item`}
                            style={{
                              left: `${left}%`,
                              width: `${width > 0 ? width : 0}%`,
                              minWidth: '1px',
                              top: `${item.lane * 2.5}rem`,
                              height: '2rem'
                            }}
                          >
                            <span className="truncate">
                              {item.project.name} ({item.role})
                              {item.description && <span className="ml-1 text-white/70">- {item.description}</span>}
                            </span>
                            <div className="tooltip bg-gray-900 text-white text-xs rounded py-1 px-2 absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none transition-opacity z-50 whitespace-nowrap group-hover/item:opacity-100">
                              {item.project.name}: {item.startDate.split('T')[0]} ~ {item.endDate.split('T')[0]}
                              {item.description && <br />}
                              {item.description && <span className="text-gray-300">{item.description}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};