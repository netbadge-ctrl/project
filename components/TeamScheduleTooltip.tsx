import React from 'react';
import { Project, User, Role } from '../types';

interface TeamScheduleTooltipProps {
  project: Project;
  allUsers: User[];
}

const RoleSection: React.FC<{ role: Role; roleName: string; allUsers: User[] }> = ({ role, roleName, allUsers }) => {
  if (!role || role.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold text-xs text-gray-400 mb-1">{roleName}</h4>
      <ul className="space-y-1 text-xs">
        {(role || []).map(member => {
          const user = allUsers.find(u => u.id === member.userId);
          if (!user) return null;
          // 优先显示 timeSlots 中的排期，如果没有则显示 startDate-endDate
          let schedule;
          if (member.timeSlots && member.timeSlots.length > 0) {
            // 显示第一个 timeSlot 的时间段
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
                schedule = `${startDate} - ${endDate}`;
              } else {
                schedule = '无排期';
              }
            } else {
              schedule = '无排期';
            }
          } else if (member.startDate && member.endDate) {
            const startDateObj = new Date(member.startDate);
            const endDateObj = new Date(member.endDate);
            if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
              schedule = `${member.startDate.replace(/-/g, '.')} - ${member.endDate.replace(/-/g, '.')}`;
            } else {
              schedule = '无排期';
            }
          } else if (member.startDate) {
            const startDateObj = new Date(member.startDate);
            if (!isNaN(startDateObj.getTime())) {
              schedule = `${member.startDate.replace(/-/g, '.')} 开始`;
            } else {
              schedule = '无排期';
            }
          } else {
            schedule = '无排期';
          }
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
