import React from 'react';
import { Role, User } from '../types';
import { IconPlus } from './Icons';

interface RoleCellProps {
  team: Role;
  allUsers: User[];
  onClick: () => void;
}

export const RoleCell: React.FC<RoleCellProps> = ({ team, allUsers, onClick }) => {
  if (!team || team.length === 0) {
    return (
        <div onClick={onClick} className="w-full h-full flex items-center justify-start text-gray-400 dark:text-gray-500 cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
            <IconPlus className="w-4 h-4 mr-1"/>
            <span>添加成员</span>
        </div>
    )
  }

  const teamMemberNames = (team || [])
    .map(member => {
        const user = allUsers.find(u => u.id === member.userId);
        return user ? user.name : null;
    })
    .filter(Boolean)
    .join(', ');

  return (
    <div onClick={onClick} className="w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 whitespace-pre-wrap">
      {teamMemberNames}
    </div>
  );
};