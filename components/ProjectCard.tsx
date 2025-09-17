import React from 'react';
import { Project, User, Priority, ProjectStatus, TeamMember } from '../types';

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, string> = {
        [Priority.DeptOKR]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/70 dark:text-red-200 dark:border-red-500/80',
        [Priority.PersonalOKR]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/70 dark:text-orange-200 dark:border-orange-500/80',
        [Priority.UrgentRequirement]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/70 dark:text-yellow-200 dark:border-yellow-500/80',
        [Priority.LowPriority]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/70 dark:text-blue-200 dark:border-blue-500/80',
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${priorityStyles[priority]}`}>
        {priority}
      </span>
    );
};

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const statusStyles: Record<ProjectStatus, string> = {
    [ProjectStatus.NotStarted]: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-600/50 dark:text-gray-300 dark:border-gray-500/60',
    [ProjectStatus.Discussion]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-600/50 dark:text-purple-300 dark:border-purple-500/60',
    [ProjectStatus.ProductDesign]: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-600/50 dark:text-indigo-300 dark:border-indigo-500/60',
    [ProjectStatus.RequirementsDone]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/50 dark:text-blue-300 dark:border-blue-500/60',
    [ProjectStatus.ReviewDone]: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-600/50 dark:text-cyan-300 dark:border-cyan-500/60',
    [ProjectStatus.InProgress]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/50 dark:text-orange-300 dark:border-orange-500/60',
    [ProjectStatus.DevDone]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/50 dark:text-yellow-300 dark:border-yellow-500/60',
    [ProjectStatus.Testing]: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-600/50 dark:text-pink-300 dark:border-pink-500/60',
    [ProjectStatus.TestDone]: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-600/50 dark:text-teal-300 dark:border-teal-500/60',
    [ProjectStatus.LaunchedThisWeek]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-600/50 dark:text-emerald-300 dark:border-emerald-500/60',
    [ProjectStatus.Completed]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-600/50 dark:text-green-300 dark:border-green-500/60',
    [ProjectStatus.Paused]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/50 dark:text-red-300 dark:border-red-500/60',
    [ProjectStatus.ProjectInProgress]: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-600/50 dark:text-violet-300 dark:border-violet-500/60',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

interface ProjectCardProps {
  project: Project;
  allUsers: User[];
  onClick?: () => void;
}

// 格式化日期为 MM-DD 格式
const formatScheduleDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  } catch {
    return '';
  }
};

// 获取成员的排期信息
const getMemberSchedule = (member: TeamMember): string => {
  // 检查是否有timeSlots
  if (member.timeSlots && member.timeSlots.length > 0) {
    const firstSlot = member.timeSlots[0];
    const startDate = formatScheduleDate(firstSlot.startDate);
    const endDate = formatScheduleDate(firstSlot.endDate);
    if (startDate && endDate) {
      return `${startDate}至${endDate}`;
    } else if (startDate) {
      return startDate;
    }
  }
  
  // 兼容旧的startDate/endDate字段
  if (member.startDate || member.endDate) {
    const startDate = formatScheduleDate(member.startDate);
    const endDate = formatScheduleDate(member.endDate);
    if (startDate && endDate) {
      return `${startDate}至${endDate}`;
    } else if (startDate) {
      return startDate;
    }
  }
  
  return '';
};

// 按排期分组成员并格式化显示
const formatMembersWithSchedule = (members: TeamMember[], allUsers: User[]): string => {
  if (!members || members.length === 0) return '-';
  
  const scheduleGroups = new Map<string, { users: User[]; schedule: string }>();
  
  members.forEach(member => {
    const user = allUsers.find(u => u.id === member.userId);
    if (!user) return;
    
    const schedule = getMemberSchedule(member);
    const key = schedule || '无排期';
    
    if (!scheduleGroups.has(key)) {
      scheduleGroups.set(key, { users: [], schedule });
    }
    scheduleGroups.get(key)!.users.push(user);
  });
  
  // 转换为数组并排序（有排期的在前，无排期的在后）
  const sortedGroups = Array.from(scheduleGroups.entries())
    .map(([key, data]) => ({ schedule: key, users: data.users, scheduleDisplay: data.schedule }))
    .sort((a, b) => {
      if (a.schedule === '无排期') return 1;
      if (b.schedule === '无排期') return -1;
      return a.schedule.localeCompare(b.schedule);
    });
  
  return sortedGroups.map(group => {
    const userNames = group.users.map(u => u.name).join(', ');
    if (group.schedule === '无排期') {
      return userNames;
    } else {
      return `${userNames}(${group.scheduleDisplay})`;
    }
  }).join('; ');
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, allUsers, onClick }) => {
  const cardClasses = "bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl p-4 flex flex-col gap-3 hover:border-[#6C63FF] transition-all duration-300";
  const clickableClasses = onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10" : "";

  return (
    <div className={`${cardClasses} ${clickableClasses}`} onClick={onClick}>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{project.name}</h3>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1.5">
        <div className="flex justify-between">
          <span>产品经理:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMembersWithSchedule(project.productManagers, allUsers)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>后端研发:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMembersWithSchedule(project.backendDevelopers, allUsers)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>前端研发:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMembersWithSchedule(project.frontendDevelopers, allUsers)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>测试:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMembersWithSchedule(project.qaTesters, allUsers)}
          </span>
        </div>
      </div>
    </div>
  );
};