import React from 'react';
import { Role, User } from '../types';
import { IconPlus } from './Icons';

interface RoleCellProps {
  team: Role;
  allUsers: User[];
  onClick: () => void;
}

// 格式化日期，只显示到日期，不显示时分秒
const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  } catch {
    return '';
  }
};

// 获取成员的排期信息
const getMemberSchedule = (member: any): string => {
  // 优先显示 timeSlots 中的排期，如果没有则显示 startDate-endDate
  if (member.timeSlots && member.timeSlots.length > 0) {
    // 显示第一个 timeSlot 的时间段
    const slot = member.timeSlots[0];
    if (slot.startDate && slot.endDate) {
      const startDate = formatDateOnly(slot.startDate);
      const endDate = formatDateOnly(slot.endDate);
      if (startDate && endDate) {
        return `${startDate}-${endDate}`;
      }
    }
  } else if (member.startDate && member.endDate) {
    const startDate = formatDateOnly(member.startDate);
    const endDate = formatDateOnly(member.endDate);
    if (startDate && endDate) {
      return `${startDate}-${endDate}`;
    }
  } else if (member.startDate) {
    const startDate = formatDateOnly(member.startDate);
    if (startDate) {
      return `${startDate}开始`;
    }
  }
  return '';
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

  return (
    <div onClick={onClick} className="w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200">
      <div className="space-y-1">
        {(team || []).map(member => {
          const user = allUsers.find(u => u.id === member.userId);
          if (!user) return null;
          
          const schedule = getMemberSchedule(member);
          
          return (
            <div key={user.id} className="flex flex-col text-xs">
              <span className="text-gray-900 dark:text-gray-200 font-medium">
                {user.name}
              </span>
              {schedule && (
                <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                  {schedule}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};