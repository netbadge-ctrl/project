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

// 获取成员的排期信息（支持多段排期）
const getMemberSchedule = (member: any): string => {
  // 检查是否有timeSlots
  if (member.timeSlots && member.timeSlots.length > 0) {
    // 过滤出有效的时段（有开始和结束日期）
    const validSlots = member.timeSlots.filter((slot: any) => slot.startDate && slot.endDate);
    
    if (validSlots.length === 0) {
      // 如果没有有效时段，检查是否有只有开始日期的时段
      const startOnlySlots = member.timeSlots.filter((slot: any) => slot.startDate && !slot.endDate);
      if (startOnlySlots.length > 0) {
        return formatScheduleDate(startOnlySlots[0].startDate);
      }
      return '';
    }
    
    // 如果只有一个时段，直接返回该时段的日期范围
    if (validSlots.length === 1) {
      const startDate = formatScheduleDate(validSlots[0].startDate);
      const endDate = formatScheduleDate(validSlots[0].endDate);
      if (startDate && endDate) {
        return `${startDate}至${endDate}`;
      }
      return startDate || '';
    }
    
    // 多段排期：找到最早的开始日期和最晚的结束日期
    const sortedSlots = validSlots.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const firstStartDate = formatScheduleDate(sortedSlots[0].startDate);
    
    // 找到最晚的结束日期
    const latestEndDate = validSlots.reduce((latest: string, slot: any) => {
      const slotEndDate = new Date(slot.endDate);
      const latestDate = new Date(latest);
      return slotEndDate > latestDate ? slot.endDate : latest;
    }, validSlots[0].endDate);
    
    const lastEndDate = formatScheduleDate(latestEndDate);
    
    if (firstStartDate && lastEndDate) {
      return `${firstStartDate}至${lastEndDate}`;
    }
    return firstStartDate || '';
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