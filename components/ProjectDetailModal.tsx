import React, { useState } from 'react';
import { Project, User, OKR, ProjectRoleKey, Priority, ProjectStatus, Role } from '../types';
import { IconX, IconStar, IconPencil, IconChevronDown } from './Icons';
import { RichTextInput } from './RichTextInput';
import { AutoResizeInput } from './AutoResizeInput';
import { AutoResizeTextarea } from './AutoResizeTextarea';

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, string> = {
        [Priority.DeptOKR]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/70 dark:text-red-200 dark:border-red-500/80',
        [Priority.PersonalOKR]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/70 dark:text-orange-200 dark:border-orange-500/80',
        [Priority.UrgentRequirement]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/70 dark:text-yellow-200 dark:border-yellow-500/80',
        [Priority.LowPriority]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/70 dark:text-blue-200 dark:border-blue-500/80',
    };
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
        [ProjectStatus.RequirementsDone]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/50 dark:text-blue-300 dark:border-blue-500/60',
        [ProjectStatus.ReviewDone]: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-600/50 dark:text-cyan-300 dark:border-cyan-500/60',
        [ProjectStatus.ProductDesign]: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-600/50 dark:text-indigo-300 dark:border-indigo-500/60',
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

const EditablePrioritySelect: React.FC<{ 
    priority: Priority; 
    onPriorityChange: (priority: Priority) => void;
}> = ({ priority, onPriorityChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const priorityOptions = [
        Priority.DeptOKR,
        Priority.PersonalOKR,
        Priority.UrgentRequirement,
        Priority.LowPriority,
    ];

    const handlePrioritySelect = (newPriority: Priority) => {
        onPriorityChange(newPriority);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] rounded-lg p-1 transition-colors group"
            >
                <PriorityBadge priority={priority} />
                <IconChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
            
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-lg z-20 min-w-[160px] max-h-60 overflow-y-auto">
                        {priorityOptions.map((priorityOption) => (
                            <button
                                key={priorityOption}
                                onClick={() => handlePrioritySelect(priorityOption)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors flex items-center"
                            >
                                <PriorityBadge priority={priorityOption} />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const EditableStatusSelect: React.FC<{ 
    status: ProjectStatus; 
    onStatusChange: (status: ProjectStatus) => void;
}> = ({ status, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statusOptions = [
        ProjectStatus.NotStarted,
        ProjectStatus.Discussion,
        ProjectStatus.ProductDesign,
        ProjectStatus.RequirementsDone,
        ProjectStatus.ReviewDone,
        ProjectStatus.InProgress,
        ProjectStatus.ProjectInProgress,
        ProjectStatus.DevDone,
        ProjectStatus.Testing,
        ProjectStatus.TestDone,
        ProjectStatus.LaunchedThisWeek,
        ProjectStatus.Completed,
        ProjectStatus.Paused,
    ];

    const handleStatusSelect = (newStatus: ProjectStatus) => {
        onStatusChange(newStatus);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] rounded-lg p-1 transition-colors group"
            >
                <StatusBadge status={status} />
                <IconChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
            
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-lg z-20 min-w-[160px] max-h-60 overflow-y-auto">
                        {statusOptions.map((statusOption) => (
                            <button
                                key={statusOption}
                                onClick={() => handleStatusSelect(statusOption)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors flex items-center"
                            >
                                <StatusBadge status={statusOption} />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const InfoBlock: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1.5">{label}</h4>
        <div className="text-sm text-gray-800 dark:text-gray-300">{children}</div>
    </div>
);

const EditableText: React.FC<{
    value: string;
    onSave: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
}> = ({ value, onSave, className = '', placeholder = '', multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleEdit = () => {
        setEditValue(value);
        setIsEditing(true);
    };

    const handleBlur = () => {
        if (editValue.trim() !== value.trim()) {
            onSave(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    const handleChange = (newValue: string) => {
        setEditValue(newValue);
    };

    if (isEditing) {
        return (
            <div className="w-full">
                {multiline ? (
                    <AutoResizeTextarea
                        value={editValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
                        autoFocus
                    />
                ) : (
                    <AutoResizeInput
                        value={editValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
                        autoFocus
                    />
                )}
            </div>
        );
    }

    return (
        <div 
            onClick={handleEdit}
            className={`group cursor-pointer rounded p-2 -m-2 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors ${className}`}
        >
            <div className="flex items-start justify-between">
                <span className={`${multiline ? 'whitespace-pre-wrap' : ''} ${!value.trim() ? 'text-gray-400 dark:text-gray-500 italic' : ''}`}>
                    {value.trim() || placeholder}
                </span>
                <IconPencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-0.5 flex-shrink-0" />
            </div>
        </div>
    );
};

interface ProjectDetailModalProps {
    project: Project;
    allUsers: User[];
    activeOkrs: OKR[];
    currentUser: User;
    onClose: () => void;
    onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
    onOpenRoleModal: (roleKey: ProjectRoleKey, roleName: string) => void;
    onToggleFollow: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
    project, allUsers, activeOkrs, currentUser, onClose, onUpdateProject, onOpenRoleModal, onToggleFollow
}) => {
    
    const [weeklyUpdateHtml, setWeeklyUpdateHtml] = useState(project.weeklyUpdate);

    const handleWeeklyUpdateBlur = () => {
        if (weeklyUpdateHtml !== project.weeklyUpdate) {
            onUpdateProject(project.id, 'weeklyUpdate', weeklyUpdateHtml);
        }
    };

    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdateProject(project.id, 'status', newStatus);
    };

    const handlePriorityChange = (newPriority: Priority) => {
        onUpdateProject(project.id, 'priority', newPriority);
    };

    const handleProjectNameSave = (newName: string) => {
        if (newName.trim() !== project.name.trim()) {
            onUpdateProject(project.id, 'name', newName.trim());
        }
    };

    const handleBusinessProblemSave = (newBusinessProblem: string) => {
        if (newBusinessProblem.trim() !== (project.businessProblem || '').trim()) {
            onUpdateProject(project.id, 'businessProblem', newBusinessProblem.trim());
        }
    };

    const roleInfo: { key: ProjectRoleKey, name: string }[] = [
        { key: 'productManagers', name: '产品经理' },
        { key: 'backendDevelopers', name: '后端研发' },
        { key: 'frontendDevelopers', name: '前端研发' },
        { key: 'qaTesters', name: '测试' },
    ];
    
    const projectOkrs = (activeOkrs || []).filter(okr =>
        (okr.keyResults || []).some(kr => (project.keyResultIds || []).includes(kr.id))
    );

    const isFollowing = (project.followers || []).includes(currentUser.id);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl w-full max-w-6xl text-gray-900 dark:text-white shadow-lg flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#363636]">
                    <div className="flex-1 mr-4">
                        <EditableText
                            value={project.name}
                            onSave={handleProjectNameSave}
                            placeholder="输入项目名称..."
                            className="text-xl font-bold"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onToggleFollow(project.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                isFollowing 
                                ? 'bg-yellow-400/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-400/30'
                                : 'bg-gray-100 dark:bg-[#2d2d2d] border-gray-300 dark:border-[#4a4a4a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                            }`}
                        >
                            <IconStar className={`w-4 h-4 ${isFollowing ? 'text-yellow-500 dark:text-yellow-400 fill-current' : ''}`} />
                            <span>{isFollowing ? '已关注' : '关注'}</span>
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="关闭">
                            <IconX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column (Info) */}
                    <div className="md:col-span-1 space-y-6">
                        <InfoBlock label="解决的业务问题">
                            <EditableText
                                value={project.businessProblem || ''}
                                onSave={handleBusinessProblemSave}
                                placeholder="输入项目要解决的业务问题..."
                                multiline
                            />
                        </InfoBlock>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoBlock label="优先级">
                                <EditablePrioritySelect 
                                    priority={project.priority} 
                                    onPriorityChange={handlePriorityChange}
                                />
                            </InfoBlock>
                            <InfoBlock label="状态">
                                <EditableStatusSelect 
                                    status={project.status} 
                                    onStatusChange={handleStatusChange}
                                />
                            </InfoBlock>
                        </div>
                        <InfoBlock label="关联的 OKR">
                            {projectOkrs.length > 0 ? (
                                <ul className="space-y-1">
                                    {(() => {
                                        // 去重处理，确保每个KR只显示一次
                                        const uniqueKrs = new Map();
                                        projectOkrs.forEach(okr => {
                                            okr.keyResults
                                                .filter(kr => project.keyResultIds.includes(kr.id))
                                                .forEach(kr => {
                                                    if (!uniqueKrs.has(kr.id)) {
                                                        uniqueKrs.set(kr.id, kr);
                                                    }
                                                });
                                        });
                                        
                                        return Array.from(uniqueKrs.values()).map((kr, index) => (
                                            <li key={kr.id} className="text-xs text-gray-700 dark:text-gray-300">
                                                KR: {kr.description}
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            ) : "未关联"}
                        </InfoBlock>
                        <InfoBlock label="上周进展/问题">
                             <div 
                                dangerouslySetInnerHTML={{ __html: project.lastWeekUpdate || `<span class="text-sm text-gray-400 dark:text-gray-500">暂无记录</span>`}}
                                className="p-2 bg-gray-100 dark:bg-[#2d2d2d] rounded-lg text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-xs max-h-40 overflow-y-auto"
                                style={{
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                }}
                            />
                        </InfoBlock>
                    </div>
                    {/* Right Column (Editable) */}
                    <div className="md:col-span-2 space-y-6">
                        <InfoBlock label="本周进展/问题">
                            <div onBlur={handleWeeklyUpdateBlur}>
                                <RichTextInput
                                    html={weeklyUpdateHtml}
                                    onChange={setWeeklyUpdateHtml}
                                    placeholder="输入本周进展/问题..."
                                    className="min-h-[150px]"
                                />
                            </div>
                        </InfoBlock>
                         <InfoBlock label="团队角色">
                            <div className="bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#4a4a4a]/80 divide-y divide-gray-200 dark:divide-white/10">
                                {roleInfo.map(({ key, name }) => {
                                    const team = project[key] as Role;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => onOpenRoleModal(key, name)}
                                            className="group flex justify-between items-start px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] cursor-pointer transition-colors"
                                        >
                                            <h5 className="font-semibold text-gray-600 dark:text-gray-300 text-sm flex-shrink-0 pr-4 pt-0.5">{name}</h5>
                                            <div className="flex items-start justify-end flex-grow gap-2">
                                                <div className="text-sm text-right">
                                                    {team.length === 0 ? (
                                                        <span className="text-gray-400 dark:text-gray-500">暂无</span>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {team.map(member => {
                                                                const user = allUsers.find(u => u.id === member.userId);
                                                                // 获取成员的排期信息（支持多段排期）
                                                                let scheduleText;
                                                                if (member.timeSlots && member.timeSlots.length > 0) {
                                                                    // 过滤出有效的时段（有开始和结束日期）
                                                                    const validSlots = member.timeSlots.filter((slot: any) => slot.startDate && slot.endDate);
                                                                                                                    
                                                                    if (validSlots.length === 0) {
                                                                        // 如果没有有效时段，检查是否有只有开始日期的时段
                                                                        const startOnlySlots = member.timeSlots.filter((slot: any) => slot.startDate && !slot.endDate);
                                                                        if (startOnlySlots.length > 0) {
                                                                            const startDateObj = new Date(startOnlySlots[0].startDate);
                                                                            if (!isNaN(startDateObj.getTime())) {
                                                                                scheduleText = startOnlySlots[0].startDate.replace(/-/g, '.') + ' 开始';
                                                                            } else {
                                                                                scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                            }
                                                                        } else {
                                                                            scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                        }
                                                                    } else if (validSlots.length === 1) {
                                                                        // 如果只有一个时段，直接返回该时段的日期范围
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
                                                                            scheduleText = `${startDate} - ${endDate}`;
                                                                        } else {
                                                                            scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                        }
                                                                    } else {
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
                                                                            scheduleText = `${startDate} - ${endDate}`;
                                                                        } else {
                                                                            scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                        }
                                                                    }
                                                                } else if (member.startDate && member.endDate) {
                                                                    const startDateObj = new Date(member.startDate);
                                                                    const endDateObj = new Date(member.endDate);
                                                                    if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                                                                        scheduleText = `${member.startDate.replace(/-/g, '.')} - ${member.endDate.replace(/-/g, '.')}`;
                                                                    } else {
                                                                        scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                    }
                                                                } else if (member.startDate) {
                                                                    const startDateObj = new Date(member.startDate);
                                                                    if (!isNaN(startDateObj.getTime())) {
                                                                        scheduleText = `${member.startDate.replace(/-/g, '.')} 开始`;
                                                                    } else {
                                                                        scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                    }
                                                                } else {
                                                                    scheduleText = <span className="text-gray-500 dark:text-gray-400">无排期</span>;
                                                                }
                                                                
                                                                return (
                                                                    <li key={member.userId} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
                                                                        <span className="text-gray-700 dark:text-gray-200 text-right">{user?.name}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">{scheduleText}</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </div>
                                                <IconPencil className="w-3 h-3 text-gray-400/0 group-hover:text-gray-400/100 dark:text-gray-600 dark:group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </InfoBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};