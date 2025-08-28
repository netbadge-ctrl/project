import React, { useState } from 'react';
import { Project, User, Priority, ProjectStatus, OKR, Role, ProjectRoleKey } from '../types';
import { IconMessageCircle } from './Icons';

const PriorityBadge: React.FC<{ priority: Priority; projectOkrs: OKR[]; project: Project }> = ({ priority, projectOkrs, project }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const priorityStyles: Record<Priority, string> = {
        [Priority.DeptOKR]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/70 dark:text-red-200 dark:border-red-500/80',
        [Priority.PersonalOKR]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/70 dark:text-orange-200 dark:border-orange-500/80',
        [Priority.Urgent]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/70 dark:text-yellow-200 dark:border-yellow-500/80',
        [Priority.Routine]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/70 dark:text-blue-200 dark:border-blue-500/80',
    }
    
    return (
        <div className="relative">
            <span 
                className={`px-2 py-0.5 text-xs font-semibold rounded-md border cursor-pointer ${priorityStyles[priority]}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {priority}
            </span>
            
            {showTooltip && (
                <div className="absolute z-[9999] top-full left-0 mt-2 w-80 p-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#363636] rounded-lg shadow-lg">
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">关联 OKR</h4>
                    <div className="text-xs space-y-2 max-h-40 overflow-y-auto">
                        {projectOkrs.length > 0 ? (
                            projectOkrs.map(okr => (
                                <div key={okr.id}>
                                    <strong className="text-gray-600 dark:text-gray-300 block">O: {okr.objective}</strong>
                                    <ul className="pl-3 list-disc list-inside">
                                        {okr.keyResults.filter(kr => (project.keyResultIds || []).includes(kr.id)).map(kr => (
                                            <li key={kr.id} className="text-gray-700 dark:text-gray-400">KR: {kr.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500 italic">未关联</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge: React.FC<{ status: ProjectStatus; project: Project; allUsers: User[] }> = ({ status, project, allUsers }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
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
    [ProjectStatus.Paused]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/50 dark:text-red-300 dark:border-red-500/60',
    [ProjectStatus.Launched]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-600/50 dark:text-green-300 dark:border-green-500/60',
  };
  
  const roleInfo: { key: ProjectRoleKey, name: string }[] = [
    { key: 'productManagers', name: '产品' },
    { key: 'backendDevelopers', name: '后端' },
    { key: 'frontendDevelopers', name: '前端' },
    { key: 'qaTesters', name: '测试' },
  ];
  
  return (
    <div className="relative">
      <span 
        className={`px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer ${statusStyles[status]}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {status}
      </span>
      
      {showTooltip && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-72 p-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#363636] rounded-lg shadow-lg">
          <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">团队角色与排期</h4>
          <div className="divide-y divide-gray-200 dark:divide-gray-600/50 text-sm">
            {roleInfo.map(({ key, name }) => {
              const team = project[key] as Role;
              return (
                <div key={key} className="flex justify-between items-start py-2 first:pt-0 last:pb-0">
                  <h5 className="font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0 pr-4">{name}</h5>
                  <div className="text-right">
                    {(team || []).length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">暂无</span>
                    ) : (
                      <ul className="space-y-1">
                        {(team || []).map(member => {
                          const user = allUsers.find(u => u.id === member.userId);
                          const scheduleText = (member.startDate && member.endDate)
                            ? `${member.startDate.replace(/-/g, '.')} - ${member.endDate.replace(/-/g, '.')}`
                            : '暂无排期';
                          
                          return (
                            <li key={member.userId} className="text-xs">
                              <div className="text-gray-700 dark:text-gray-200">{user?.name}</div>
                              <div className="text-gray-500 dark:text-gray-400 font-mono">{scheduleText}</div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface WeeklyMeetingProjectCardProps {
    project: Project;
    allUsers: User[];
    activeOkrs: OKR[];
    onOpenCommentModal: () => void;
}

const UpdateDisplay: React.FC<{html: string, title: string}> = ({html, title}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const content = html || '<p class="text-gray-400 dark:text-gray-500 italic">无</p>';
    
    return (
        <div className="relative">
            <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</h4>
            <div
                className="p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg min-h-[80px] max-h-[120px] overflow-hidden text-sm text-gray-800 dark:text-gray-300 weekly-update-content cursor-pointer leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            />
            
            {showTooltip && (
                <div className="absolute z-[9999] top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#363636] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</h4>
                    <div
                        className="text-sm text-gray-800 dark:text-gray-300 weekly-update-content"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            )}
            
            {/* Basic styling for contenteditable output */}
            <style>{`
              .weekly-update-content b { font-weight: 600; }
              .weekly-update-content font[color="#ef4444"] { color: #ef4444; }
            `}</style>
        </div>
    );
};


const BusinessProblemDisplay: React.FC<{businessProblem: string}> = ({businessProblem}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const content = businessProblem || '无';
    
    return (
        <div className="relative">
            <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">解决的业务问题</h4>
            <div 
                className="p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg text-sm text-gray-800 dark:text-gray-300 h-20 overflow-hidden cursor-pointer leading-relaxed flex items-start"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <p className="whitespace-pre-wrap line-clamp-3 w-full">
                    {content === '无' ? <span className="text-gray-400 dark:text-gray-500 italic">无</span> : content}
                </p>
            </div>
            
            {showTooltip && content !== '无' && (
                <div className="absolute z-[9999] top-full left-0 mt-2 w-80 p-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#363636] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">解决的业务问题</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{content}</p>
                </div>
            )}
        </div>
    );
};

export const WeeklyMeetingProjectCard: React.FC<WeeklyMeetingProjectCardProps> = ({ project, allUsers, activeOkrs, onOpenCommentModal }) => {
    const projectOkrs = activeOkrs.filter(okr => 
        okr.keyResults.some(kr => (project.keyResultIds || []).includes(kr.id))
    );

    return (
        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 w-full overflow-visible">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#363636]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight max-h-[3.5rem] overflow-hidden">{project.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                    <PriorityBadge priority={project.priority} projectOkrs={projectOkrs} project={project} />
                    <StatusBadge status={project.status} project={project} allUsers={allUsers} />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3 flex-grow flex flex-col overflow-visible">
                {/* Business Problem Section */}
                <div className="flex-shrink-0">
                    <BusinessProblemDisplay businessProblem={project.businessProblem} />
                </div>

                {/* Updates Section - 改为上下布局，本周在上 */}
                <div className="space-y-4 flex-grow">
                    <div>
                        <UpdateDisplay title="本周进展/问题" html={project.weeklyUpdate} />
                    </div>
                    <div>
                        <UpdateDisplay title="上周进展/问题" html={project.lastWeekUpdate} />
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-[#363636] bg-gray-50 dark:bg-[#2a2a2a]/50 rounded-b-xl flex justify-end">
                <button
                    onClick={onOpenCommentModal}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#3a3a3a] border border-gray-300 dark:border-[#4a4a4a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#454545] transition-colors"
                >
                    <IconMessageCircle className="w-4 h-4" />
                    评论 ({(project.comments || []).length})
                </button>
            </div>
        </div>
    );
};
