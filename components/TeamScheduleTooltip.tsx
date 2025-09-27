import React from 'react';
import { Project, User, Role } from '../types';

interface TeamScheduleTooltipProps {
  project: Project;
  allUsers: User[];
}

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
        const startDateObj = new Date(startOnlySlots[0].startDate);
        if (!isNaN(startDateObj.getTime())) {
          return startOnlySlots[0].startDate.replace(/-/g, '.') + ' 开始';
        }
      }
      return '无排期';
    }
    
    // 如果只有一个时段，直接返回该时段的日期范围
    if (validSlots.length === 1) {
      const slot = validSlots[0];
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
        return `${startDate} - ${endDate}`;
      }
      return '无排期';
    }
    
    // 多段排期：找到最早的开始日期和最晚的结束日期
    const sortedSlots = validSlots.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const firstStartDateObj = new Date(sortedSlots[0].startDate);
    
    // 找到最晚的结束日期
    const latestEndDate = validSlots.reduce((latest: string, slot: any) => {
      const slotEndDate = new Date(slot.endDate);
      const latestDate = new Date(latest);
      return slotEndDate > latestDate ? slot.endDate : latest;
    }, validSlots[0].endDate);
    
    const lastEndDateObj = new Date(latestEndDate);
    
    if (!isNaN(firstStartDateObj.getTime()) && !isNaN(lastEndDateObj.getTime())) {
      const startDate = firstStartDateObj.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '.');
      const endDate = lastEndDateObj.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '.');
      return `${startDate} - ${endDate}`;
    }
    return '无排期';
  }
  
  // 兼容旧的startDate/endDate字段
  if (member.startDate && member.endDate) {
    const startDateObj = new Date(member.startDate);
    const endDateObj = new Date(member.endDate);
    if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
      return `${member.startDate.replace(/-/g, '.')} - ${member.endDate.replace(/-/g, '.')}`;
    }
  } else if (member.startDate) {
    const startDateObj = new Date(member.startDate);
    if (!isNaN(startDateObj.getTime())) {
      return `${member.startDate.replace(/-/g, '.')} 开始`;
    }
  }
  
  return '无排期';
};

const RoleSection: React.FC<{ role: Role; roleName: string; allUsers: User[] }> = ({ role, roleName, allUsers }) => {
  if (!role || role.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold text-xs text-gray-400 mb-1">{roleName}</h4>
      <ul className="space-y-1 text-xs">
        {(role || []).map(member => {
          const user = allUsers.find(u => u.id === member.userId);
          if (!user) return null;
          
          const schedule = getMemberSchedule(member);
          
          return (
            <li key={user.id} className="flex justify-between items-center gap-3">
              <span className="text-gray-200">{user.name}</span>
              <span className="text-gray-400 font-mono">{schedule}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const TeamScheduleTooltip: React.FC<TeamScheduleTooltipProps> = ({ project, allUsers }) => {
  const roles = [
    { data: project.productManagers || [], name: '产品经理' },
    { data: project.backendDevelopers || [], name: '后端研发' },
    { data: project.frontendDevelopers || [], name: '前端研发' },
    { data: project.qaTesters || [], name: '测试' },
  ];

  const hasAnyMembers = roles.some(r => (r.data || []).length > 0);

  return (
    <div className="bg-gray-800/95 dark:bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl w-64 text-sm space-y-2 border border-white/10">
      <h3 className="font-bold mb-2 border-b border-gray-600 pb-1.5">{project.name} - 团队排期</h3>
      {hasAnyMembers ? (
        roles.map(role => (
          <RoleSection key={role.name} role={role.data} roleName={role.name} allUsers={allUsers} />
        ))
      ) : (
        <p className="text-gray-400 text-xs italic">该项目暂无成员分配。</p>
      )}
    </div>
  );
};
