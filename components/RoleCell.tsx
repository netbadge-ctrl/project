import React from 'react';
import { Role, User } from '../types';
import { IconPlus } from './Icons';

interface RoleCellProps {
  team: Role;
  allUsers: User[];
  onClick: () => void;
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
const getMemberSchedule = (member: any): string => {
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

// 按排期分组成员
const groupMembersBySchedule = (teamMembers: any[], allUsers: User[]): { schedule: string; members: { user: User; member: any }[] }[] => {
  const scheduleGroups = new Map<string, { user: User; member: any }[]>();
  
  teamMembers.forEach(member => {
    const user = allUsers.find(u => u.id === member.userId);
    if (!user) return;
    
    const schedule = getMemberSchedule(member);
    const key = schedule || '无排期';
    
    if (!scheduleGroups.has(key)) {
      scheduleGroups.set(key, []);
    }
    scheduleGroups.get(key)!.push({ user, member });
  });
  
  // 转换为数组并排序（有排期的在前，无排期的在后）
  return Array.from(scheduleGroups.entries())
    .map(([schedule, members]) => ({ schedule, members }))
    .sort((a, b) => {
      if (a.schedule === '无排期') return 1;
      if (b.schedule === '无排期') return -1;
      return a.schedule.localeCompare(b.schedule);
    });
};

export const RoleCell: React.FC<RoleCellProps> = ({ team, allUsers, onClick }) => {
  if (!team || team.length === 0) {
    return (
        <div onClick={onClick} className="w-full h-full flex items-center justify-start text-gray-400 dark:text-gray-500 cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
            <IconPlus className="w-4 h-4 mr-1"/>
            <span>添加成员</span>
        </div>
    )
  }

  const scheduleGroups = groupMembersBySchedule(team || [], allUsers);

  return (
    <div onClick={onClick} className="w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200">
      <div className="space-y-2">
        {scheduleGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col items-center">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {group.members.map((memberData, memberIndex) => (
                <span key={memberData.user.id} className="text-sm text-gray-800 dark:text-gray-200">
                  {memberData.user.name}
                  {memberIndex < group.members.length - 1 && ', '}
                </span>
              ))}
            </div>
            {group.schedule !== '无排期' && (
              <div className="mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                  {group.schedule}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};