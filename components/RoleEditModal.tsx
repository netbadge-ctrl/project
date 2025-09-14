import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Project, User, Role, TeamMember, ProjectRoleKey, TimeSlot } from '../types';
import { IconX, IconTrash, IconPlus, IconLink, IconSearch } from './Icons';
import { EnhancedDateRangePicker } from './EnhancedDateRangePicker';
import { MultiTimeSlotEditor } from './MultiTimeSlotEditor';
import { fuzzySearch } from '../utils';
import { SearchableSingleSelectDropdown } from './SearchableSingleSelectDropdown';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

interface RoleEditModalProps {
  project: Project;
  roleKey: ProjectRoleKey;
  roleName: string;
  allUsers: User[];
  onClose: () => void;
  onSave: (projectId: string, roleKey: ProjectRoleKey, newRole: Role) => void;
}

type TeamMemberWithState = TeamMember & { useSharedSchedule: boolean; useMultiTimeSlots: boolean; _tempId: string };

export const RoleEditModal: React.FC<RoleEditModalProps> = ({ project, roleKey, roleName, allUsers, onClose, onSave }) => {
  const [currentTeam, setCurrentTeam] = useState<TeamMemberWithState[]>(
    (project[roleKey] || []).map((m, index) => ({ 
        ...m, 
        useSharedSchedule: m.useSharedSchedule ?? false,
        useMultiTimeSlots: false,
        timeSlots: m.timeSlots && m.timeSlots.length > 0 ? m.timeSlots : [
          {
            id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
            startDate: m.startDate || '',
            endDate: m.endDate || '',
            description: ''
          }
        ],
        _tempId: `member_${index}_${Date.now()}`
    }))
  );
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const addMemberContainerRef = useRef<HTMLDivElement>(null);
  const addMemberSearchInputRef = useRef<HTMLInputElement>(null);
  const addMemberTriggerRef = useRef<HTMLButtonElement>(null);
  const addMemberMenuRef = useRef<HTMLDivElement>(null);
  const addMemberMenuStyle = useDropdownPosition({ 
      triggerRef: addMemberTriggerRef, 
      menuRef: addMemberMenuRef,
      isOpen: isAddingMember,
      preferredPosition: 'top',
      gap: 8,
  });

  const availableUsers = useMemo(() => {
    const teamUserIds = new Set(currentTeam.map(m => m.userId));
    const filtered = allUsers.filter(u => !teamUserIds.has(u.id));
    if (!addMemberSearch) return filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    return filtered
      .filter(u => fuzzySearch(addMemberSearch, u.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [allUsers, currentTeam, addMemberSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMemberContainerRef.current && !addMemberContainerRef.current.contains(event.target as Node) &&
          addMemberMenuRef.current && !addMemberMenuRef.current.contains(event.target as Node)) {
        setIsAddingMember(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isAddingMember) {
        setAddMemberSearch('');
        setTimeout(() => addMemberSearchInputRef.current?.focus(), 100);
    }
  }, [isAddingMember]);


  const handleAddMember = (userId: string) => {
    if (userId) {
      const isFirstMember = currentTeam.length === 0;
      const newMember: TeamMemberWithState = {
        userId,
        startDate: '',
        endDate: '',
        useSharedSchedule: !isFirstMember,
        useMultiTimeSlots: false,
        timeSlots: [{
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startDate: '',
          endDate: '',
          description: ''
        }],
        _tempId: `member_new_${Date.now()}`
      };
      setCurrentTeam(prev => [...prev, newMember]);
      setIsAddingMember(false);
    }
  };

  const handleUpdateMember = (tempId: string, newUserId: string) => {
    setCurrentTeam(prevTeam => prevTeam.map(m => m._tempId === tempId ? { ...m, userId: newUserId } : m));
  };

  const handleRemoveMember = (tempId: string) => {
    setCurrentTeam(prev => prev.filter(m => m._tempId !== tempId));
  };
  
  const handleIndividualDateChange = (tempId: string, startDate: string, endDate: string) => {
    setCurrentTeam(prev => prev.map(m => {
      if (m._tempId === tempId) {
        return { ...m, startDate, endDate };
      }
      // 如果修改的是第一个成员，且其他成员启用了共享排期，则同步更新
      if (tempId === firstMember?._tempId && m.useSharedSchedule) {
        return { ...m, startDate, endDate };
      }
      return m;
    }));
  };
  
  const handleToggleSharedSchedule = (tempId: string) => {
    setCurrentTeam(prev => prev.map(m => {
      if (m._tempId === tempId) {
        const newUseSharedSchedule = !m.useSharedSchedule;
        
        // 如果启用共享排期，复制第一个成员的排期信息
        if (newUseSharedSchedule && firstMember) {
          return {
            ...m,
            useSharedSchedule: newUseSharedSchedule,
            startDate: firstMember.startDate,
            endDate: firstMember.endDate,
            timeSlots: firstMember.timeSlots ? [...firstMember.timeSlots] : []
          };
        } else {
          // 如果取消共享排期，清空排期信息
          return {
            ...m,
            useSharedSchedule: newUseSharedSchedule,
            startDate: '',
            endDate: '',
            timeSlots: [{
              id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              startDate: '',
              endDate: '',
              description: ''
            }]
          };
        }
      }
      return m;
    }));
  };

  const handleToggleMultiTimeSlots = (tempId: string) => {
    setCurrentTeam(prev => prev.map(m => m._tempId === tempId ? { ...m, useMultiTimeSlots: !m.useMultiTimeSlots } : m));
  };

  const handleUpdateTimeSlots = (tempId: string, timeSlots: TimeSlot[]) => {
    setCurrentTeam(prev => prev.map(m => {
      if (m._tempId === tempId) {
        return { ...m, timeSlots };
      }
      // 如果修改的是第一个成员，且其他成员启用了共享排期，则同步更新
      if (tempId === firstMember?._tempId && m.useSharedSchedule) {
        return { ...m, timeSlots: [...timeSlots] };
      }
      return m;
    }));
  };
  
  const handleSave = () => {
    // 在保存前，确保所有启用共享排期的成员都有最新的排期数据
    const updatedTeam = currentTeam.map((member) => {
      if (member.useSharedSchedule && firstMember && member._tempId !== firstMember._tempId) {
        return {
          ...member,
          startDate: firstMember.startDate,
          endDate: firstMember.endDate,
          timeSlots: firstMember.timeSlots ? [...firstMember.timeSlots] : []
        };
      }
      return member;
    });

    const finalTeam = updatedTeam.map((member) => {
        const { _tempId, useMultiTimeSlots, useSharedSchedule, ...memberData } = member;
        
        // 确保 timeSlots 数据被保留
        const cleanedMember = {
            ...memberData,
            timeSlots: member.timeSlots || []
        } as TeamMember;
        
        return cleanedMember;
    });

    const seenUserIds = new Set();
    const uniqueFinalTeam = finalTeam.filter(member => {
        if(seenUserIds.has(member.userId)) return false;
        seenUserIds.add(member.userId);
        return true;
    });

    onSave(project.id, roleKey, uniqueFinalTeam);
  };

  const ringClass = "focus:ring-2 focus:ring-[#6C63FF]";
  
  const firstMember = currentTeam.length > 0 ? currentTeam[0] : null;
  const firstUser = firstMember ? allUsers.find(u => u.id === firstMember.userId) : null;
  const firstMemberScheduleText = firstMember?.startDate && firstMember?.endDate ? `${firstMember.startDate} ~ ${firstMember.endDate}` : "请为第一位成员设置排期";

  const addMemberMenu = (
    <div ref={addMemberMenuRef} style={{...addMemberMenuStyle, width: addMemberTriggerRef.current?.getBoundingClientRect().width}} className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl flex flex-col">
       <div className="p-2 border-b border-gray-200 dark:border-[#4a4a4a]">
            <div className="relative">
               <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
               <input
                 ref={addMemberSearchInputRef}
                 type="text"
                 placeholder="搜索用户..."
                 value={addMemberSearch}
                 onChange={(e) => setAddMemberSearch(e.target.value)}
                 className="bg-gray-50 dark:bg-[#232323] border border-gray-300 dark:border-[#4a4a4a] rounded-md pl-8 pr-2 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
               />
            </div>
        </div>
       <ul className="p-1 flex-grow overflow-y-auto max-h-48">
          {availableUsers.map(user => (
            <li key={user.id}>
                <button onClick={() => handleAddMember(user.id)} className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-[#3a3a3a]">
                    {user.name}
                </button>
            </li>
          ))}
          {availableUsers.length === 0 && (
             <li className="px-3 py-2 text-sm text-gray-500 text-center">
                 {addMemberSearch ? '无匹配用户' : '所有用户都已添加'}
             </li>
          )}
       </ul>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl w-full max-w-3xl text-gray-900 dark:text-white shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#363636]">
          <h2 id="modal-title" className="text-xl font-bold">编辑{roleName}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="关闭">
            <IconX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
            {/* Team Members Section */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">团队成员</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">可自由增减人数</p>
                </div>
                <div className="space-y-3">
                    {currentTeam.map((member, index) => {
                        const user = allUsers.find(u => u.id === member.userId);
                        if (!user) return null;

                        const memberOptions = [
                            { value: user.id, label: user.name },
                            ...availableUsers.map(u => ({ value: u.id, label: u.name }))
                        ];

                        return (
                            <div key={member._tempId} className="bg-gray-100 dark:bg-[#2d2d2d] p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                      成员 {index + 1}
                                      {index === 0 && <span className="text-xs font-normal text-gray-500 ml-1">(排期负责人)</span>}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        {index > 0 && firstUser && (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="checkbox" checked={member.useSharedSchedule} onChange={() => handleToggleSharedSchedule(member._tempId)} className={`h-4 w-4 rounded bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-[#6C63FF] ${ringClass}`} />
                                                与 {firstUser.name} 排期相同
                                            </label>
                                        )}
                                        <button onClick={() => handleRemoveMember(member._tempId)} className="p-1 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-full" aria-label={`移除 ${user.name}`}>
                                            <IconTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {/* 标签行 */}
                                <div className="flex gap-6 mb-2">
                                    <div className="w-32">
                                        <label className="text-sm text-gray-500 dark:text-gray-400">负责人</label>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400">排期</label>
                                    </div>
                                </div>
                                
                                {/* 内容区域 */}
                                <div className="flex gap-6 items-start">
                                    {/* 负责人下拉框 */}
                                    <div className="w-32">
                                        <SearchableSingleSelectDropdown
                                            value={member.userId}
                                            onChange={(newUserId) => handleUpdateMember(member._tempId, newUserId)}
                                            options={memberOptions}
                                            placeholder="选择成员"
                                        />
                                    </div>
                                    
                                    {/* 排期时段列表 */}
                                    <div className="flex-1 space-y-2">
                                        {(member.timeSlots || []).map((slot) => (
                                            <div key={slot.id} className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <EnhancedDateRangePicker
                                                        startDate={slot.startDate}
                                                        endDate={slot.endDate}
                                                        onSelectRange={(start, end) => {
                                                            const updatedSlots = (member.timeSlots || []).map(s => 
                                                                s.id === slot.id ? { ...s, startDate: start, endDate: end } : s
                                                            );
                                                            handleUpdateTimeSlots(member._tempId, updatedSlots);
                                                        }}
                                                        placeholder="选择日期范围"
                                                        compact={true}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const updatedSlots = (member.timeSlots || []).filter(s => s.id !== slot.id);
                                                        handleUpdateTimeSlots(member._tempId, updatedSlots);
                                                    }}
                                                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                                                    title="删除时段"
                                                >
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {/* 添加时段按钮 */}
                                        <button
                                            onClick={() => {
                                                const newSlot = {
                                                    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                    startDate: '',
                                                    endDate: '',
                                                    description: ''
                                                };
                                                const updatedSlots = [...(member.timeSlots || []), newSlot];
                                                handleUpdateTimeSlots(member._tempId, updatedSlots);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-2 text-[#6C63FF] hover:text-[#5a52d9] hover:bg-[#6C63FF]/5 rounded-md transition-colors text-sm font-medium"
                                        >
                                            <IconPlus className="w-4 h-4" />
                                            添加时段
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Add Member Button */}
            <div ref={addMemberContainerRef}>
                <button
                    ref={addMemberTriggerRef}
                    onClick={() => setIsAddingMember(p => !p)}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg py-3 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <IconPlus className="w-5 h-5" />
                    <span className="font-semibold">添加成员</span>
                </button>
                {isAddingMember && ReactDOM.createPortal(addMemberMenu, document.body)}
            </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-4 p-4 border-t border-gray-200 dark:border-[#363636]">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-[#3a3a3a] border border-gray-300 dark:border-[#4a4a4a] rounded-lg font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">取消</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#6C63FF] text-white rounded-lg font-semibold text-sm hover:bg-[#5a52d9] transition-colors">保存更改</button>
        </div>
      </div>
    </div>
  );
};