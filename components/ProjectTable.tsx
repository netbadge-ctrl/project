import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Project, User, ProjectStatus, ProjectRoleKey, OKR, Priority, Role } from '../types';
import { IconTrash, IconCheck, IconX, IconMoreHorizontal, IconStar, IconMessageCircle, IconHistory, IconChevronDown, IconPlus } from './Icons';
import { RoleCell } from './RoleCell';
import { ConfirmDialog } from './ConfirmDialog';
import { DatePicker } from './DatePicker';
import { RichTextInput } from './RichTextInput';
import { RichTextEditableCell } from './RichTextEditableCell';
import { TooltipPortal } from './TooltipPortal';
import { TeamScheduleTooltip } from './TeamScheduleTooltip';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import KRSelectionModal from './KRSelectionModal';
import { formatDateOnly } from '../utils';

interface ProjectTableProps {
  projects: Project[];
  allUsers: User[];
  activeOkrs: OKR[];
  currentUser: User;
  editingId: string | null;
  onSaveNewProject: (project: Project) => void;
  onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
  onDeleteProject: (id: string) => void;
  onCancelNewProject: (id: string) => void;
  onOpenModal: (type: 'role' | 'comments' | 'changelog', projectId: string, details?: any) => void;
  onToggleFollow: (projectId: string) => void;
  onCreateProject: () => void;
}

const tableHeaders = [
    { key: 'name', label: '项目名称', width: '200px' },
    { key: 'businessProblem', label: '解决的业务问题', width: '300px' },
    { key: 'status', label: '状态', width: '120px' },
    { key: 'priority', label: '优先级', width: '150px' },
    { key: 'keyResults', label: '关联的KR', width: '100px' },
    { key: 'weeklyUpdate', label: '本周进展/问题', width: '300px' },
    { key: 'lastWeekUpdate', label: '上周进展/问题', width: '300px' },
    { key: 'productManagers', label: '产品经理', width: '150px' },
    { key: 'backendDevelopers', label: '后端研发', width: '150px' },
    { key: 'frontendDevelopers', label: '前端研发', width: '150px' },
    { key: 'qaTesters', label: '测试', width: '150px' },
    { key: 'proposedDate', label: '提出时间', width: '150px' },
    { key: 'launchDate', label: '上线时间', width: '150px' },
    { key: 'actions', label: '操作', width: '100px' }
];

const commonTdClass = "px-4 py-2 text-sm text-gray-700 dark:text-gray-300 align-middle";
const editInputClass = "bg-gray-100 dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-2 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]";
const editTextAreaClass = `${editInputClass} min-h-[80px] whitespace-pre-wrap resize-y`;

const leftStickyColumnCount = 3;
const rightStickyColumnCount = 1;


const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, string> = {
        [Priority.DeptOKR]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/70 dark:text-red-200 dark:border-red-500/80',
        [Priority.PersonalOKR]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/70 dark:text-orange-200 dark:border-orange-500/80',
        [Priority.Urgent]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/70 dark:text-yellow-200 dark:border-yellow-500/80',
        [Priority.Routine]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/70 dark:text-blue-200 dark:border-blue-500/80',
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border whitespace-nowrap ${priorityStyles[priority]}`}>
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
    [ProjectStatus.Paused]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/50 dark:text-red-300 dark:border-red-500/60',
    [ProjectStatus.Launched]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-600/50 dark:text-green-300 dark:border-green-500/60',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const EditableCell = ({ value, onSave, type = 'text', className = '', options, displayValue, selectType } : { value: string, onSave: (value: any) => void, type?: 'text' | 'textarea' | 'select', className?: string, options?: {value: string, label: string}[], displayValue?: string, selectType?: 'status' | 'priority' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuStyle = useDropdownPosition({ triggerRef, menuRef, isOpen: isSelectOpen });

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node) && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsSelectOpen(false);
            }
        };
        if (isSelectOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSelectOpen]);
    
    const handleSave = () => {
        if(currentValue !== value) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    const handleSelectSave = (newValue: string) => {
        if(newValue !== value) onSave(newValue);
        setIsSelectOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (type === 'textarea') {
                // 对于textarea，支持换行：Shift+Enter换行，Enter保存
                if (!e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                }
                // Shift+Enter允许换行（默认行为）
            } else {
                // 对于普通input，Enter直接保存
                handleSave();
            }
        } else if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const renderValue = () => {
        if (displayValue) return displayValue;
        if (type === 'select') {
            if (selectType === 'status') return <StatusBadge status={value as ProjectStatus} />;
            if (selectType === 'priority') return <PriorityBadge priority={value as Priority} />;
        }
        return value || <span className="text-gray-400 dark:text-gray-500">N/A</span>;
    }

    if (type === 'select') {
        let selectOptions;
        if (selectType === 'status') selectOptions = Object.values(ProjectStatus).map(s => ({value: s, label: s}));
        else if (selectType === 'priority') selectOptions = Object.values(Priority).map(p => ({value: p, label: p}));
        else selectOptions = options || [];

        const menuContent = (
            <div ref={menuRef} style={menuStyle} className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl py-1">
                <ul className="max-h-60 overflow-y-auto">
                    {selectOptions.map(option => (
                        <li key={option.value}>
                            <button onClick={() => handleSelectSave(option.value)} className={`w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] ${value === option.value ? 'font-bold bg-gray-100 dark:bg-[#3a3a3a]' : ''}`}>
                                {option.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );

        return (
            <>
                <div ref={triggerRef} onClick={() => setIsSelectOpen(true)} className={`w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center ${className}`}>
                    <div className="whitespace-pre-wrap">{renderValue()}</div>
                </div>
                {isSelectOpen && ReactDOM.createPortal(menuContent, document.body)}
            </>
        )
    }

    if (isEditing) {
        if (type === 'textarea') {
            return <textarea ref={inputRef as React.Ref<HTMLTextAreaElement>} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${editTextAreaClass} ${className}`} />;
        }
        return <input ref={inputRef as React.Ref<HTMLInputElement>} type={type} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${editInputClass} ${className}`} />;
    }
    
    return (
        <div onClick={() => setIsEditing(true)} className={`w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center ${className}`}>
             <div className="whitespace-pre-wrap">{renderValue()}</div>
        </div>
    );
};


const OkrMultiSelectCell: React.FC<{
  selectedKrIds: string[];
  allOkrs: OKR[];
  onSave: (newKrIds: string[]) => void;
  isInvalid?: boolean;
}> = ({ selectedKrIds, allOkrs, onSave, isInvalid = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const allKrsMap = useMemo(() => {
    const map = new Map<string, { description: string; oNumber: number; krNumber: number; objective: string }>();
    (allOkrs || []).forEach((okr, okrIndex) => {
      (okr.keyResults || []).forEach((kr, krIndex) => {
        map.set(kr.id, {
          description: kr.description,
          oNumber: okrIndex + 1,
          krNumber: krIndex + 1,
          objective: okr.objective,
        });
      });
    });
    return map;
  }, [allOkrs]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = (newKrIds: string[]) => {
    onSave(newKrIds);
  };

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={handleOpenModal}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center justify-center min-h-[36px] ${
          isInvalid ? 'border border-red-500' : ''
        }`}
      >
        {isInvalid ? (
          <span className="text-red-500 font-semibold text-xs">必填</span>
        ) : (selectedKrIds || []).length > 0 ? (
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{(selectedKrIds || []).length}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">N/A</span>
        )}
      </div>

      {/* KR Selection Modal */}
      <KRSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedKrIds={selectedKrIds}
        allOkrs={allOkrs}
        onSave={handleSave}
        isInvalid={isInvalid}
      />

      {/* Hover Tooltip */}
      {isHovering && !isModalOpen && (selectedKrIds || []).length > 0 && triggerRef.current && (
        <TooltipPortal targetRect={triggerRef.current.getBoundingClientRect()}>
          <div className="bg-gray-800/95 dark:bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl w-80 text-sm space-y-2 border border-white/10">
            <h3 className="font-bold mb-2 border-b border-gray-600 pb-1.5">关联的关键成果 (KR)</h3>
            <ul className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
              {(selectedKrIds || []).map(krId => {
                const krDetails = allKrsMap.get(krId);
                if (!krDetails) return null;
                return (
                  <li key={krId}>
                    <strong className="text-gray-300 block">O{krDetails.oNumber}-KR{krDetails.krNumber}: {krDetails.objective}</strong>
                    <span className="text-gray-400 pl-2">{krDetails.description}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </TooltipPortal>
      )}
    </div>
  );
};


const ActionsCell: React.FC<{
  project: Project;
  currentUser: User;
  onDelete: () => void;
  onToggleFollow: () => void;
  onOpenModal: (type: 'comments' | 'changelog') => void;
}> = ({ project, currentUser, onDelete, onToggleFollow, onOpenModal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuStyle = useDropdownPosition({ triggerRef: buttonRef, menuRef, isOpen, align: 'end', gap: 8 });
    const isFollowing = (project.followers || []).includes(currentUser.id);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const handleDeleteClick = () => {
        setIsOpen(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete();
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const menuContent = (
        <div ref={menuRef} style={menuStyle} className="w-40 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl py-1">
            <ul>
                <li><button onClick={() => handleAction(onToggleFollow)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"><IconStar className={`w-4 h-4 ${isFollowing ? 'text-yellow-400 fill-yellow-400' : ''}`} /><span>{isFollowing ? '取消关注' : '关注'}</span></button></li>
                <li><button onClick={() => handleAction(() => onOpenModal('comments'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"><IconMessageCircle className="w-4 h-4" /><span>评论</span></button></li>
                <li><button onClick={() => handleAction(() => onOpenModal('changelog'))} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"><IconHistory className="w-4 h-4" /><span>变更记录</span></button></li>
                <li><hr className="border-t border-gray-200 dark:border-[#4a4a4a] my-1" /></li>
                <li><button onClick={handleDeleteClick} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><IconTrash className="w-4 h-4" /><span>删除</span></button></li>
            </ul>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-center">
                <button ref={buttonRef} onClick={() => setIsOpen(prev => !prev)} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-gray-900 dark:hover:text-white">
                    <IconMoreHorizontal className="w-5 h-5" />
                </button>
                {isOpen && ReactDOM.createPortal(menuContent, document.body)}
            </div>
            
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="删除项目"
                message={`您确定要删除项目 "${project.name}" 吗？此操作无法撤销，所有相关数据将被永久删除。`}
                confirmText="删除"
                cancelText="取消"
                type="danger"
            />
        </>
    );
};

const InlineSelect: React.FC<{
    options: { value: string, label: string }[];
    value: string;
    onSave: (newValue: string) => void;
    placeholder?: string;
}> = ({ options, value, onSave, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuStyle = useDropdownPosition({ triggerRef, menuRef, isOpen });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node) && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onSave(optionValue);
        setIsOpen(false);
    };

    const menuContent = (
        <div ref={menuRef} style={menuStyle} className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl py-1">
            <ul className="max-h-60 overflow-y-auto">
                {options.map(option => (
                    <li key={option.value}>
                        <button onClick={() => handleSelect(option.value)} className={`w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] ${value === option.value ? 'font-bold bg-gray-100 dark:bg-[#3a3a3a]' : ''}`}>
                            {option.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
    
    const selectedLabel = options.find(o => o.value === value)?.label;

    return (
        <>
            <div ref={triggerRef} onClick={() => setIsOpen(p => !p)} className={`${editInputClass} flex items-center justify-between cursor-pointer`}>
                <span className={!selectedLabel ? 'text-gray-400 dark:text-gray-500' : ''}>{selectedLabel || placeholder}</span>
                <IconChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && ReactDOM.createPortal(menuContent, document.body)}
        </>
    );
};

interface ProjectRowProps {
    project: Project;
    allUsers: User[];
    activeOkrs: OKR[];
    currentUser: User;
    onSave: (project: Project) => void;
    onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
    onDelete: (id: string) => void;
    onCancel: (id: string) => void;
    onOpenModal: (type: 'role' | 'comments' | 'changelog', projectId: string, details?: any) => void;
    onToggleFollow: (projectId: string) => void;
    columnStyles: React.CSSProperties[];
    getTdClassName: (index: number, isNew?: boolean) => string;
    onCellMouseEnter: (e: React.MouseEvent, project: Project) => void;
    onCellMouseLeave: () => void;
}

const ProjectRow: React.FC<ProjectRowProps> = React.memo(({ project, allUsers, activeOkrs, currentUser, onSave, onUpdateProject, onDelete, onCancel, onOpenModal, onToggleFollow, columnStyles, getTdClassName, onCellMouseEnter, onCellMouseLeave }) => {

  const handleUpdateField = (field: keyof Project, value: any) => {
    onUpdateProject(project.id, field, value);
  };

  const roleInfo: { key: ProjectRoleKey, name: string }[] = [
      { key: 'productManagers', name: '产品经理' },
      { key: 'backendDevelopers', name: '后端研发' },
      { key: 'frontendDevelopers', name: '前端研发' },
      { key: 'qaTesters', name: '测试' },
  ];

  const handleOpenRoleModal = (roleKey: ProjectRoleKey, roleName: string) => {
      onOpenModal('role', project.id, { roleKey, roleName });
  };
  
  const isKrInvalid = false; // 移除KR关联校验限制

  if (project.isNew) {
    return (
      <tr className="bg-indigo-50 dark:bg-[#2a2a2a]/50 border-b border-gray-200 dark:border-[#363636] relative">
        <td style={columnStyles[0]} className={getTdClassName(0, true)}><input type="text" value={project.name} onChange={(e) => handleUpdateField('name', e.target.value)} className={editInputClass} placeholder="新项目名称" /></td>
        <td style={columnStyles[1]} className={getTdClassName(1, true)}><textarea value={project.businessProblem} onChange={(e) => handleUpdateField('businessProblem', e.target.value)} className={editTextAreaClass} placeholder="解决的核心业务问题" /></td>
        <td style={columnStyles[2]} className={getTdClassName(2, true)}><InlineSelect value={project.status} onSave={(v) => handleUpdateField('status', v)} options={Object.values(ProjectStatus).map(s => ({value: s, label: s}))} placeholder="选择状态" /></td>
        <td style={columnStyles[3]} className={getTdClassName(3, true)}><InlineSelect value={project.priority} onSave={(v) => handleUpdateField('priority', v)} options={Object.values(Priority).map(p => ({value: p, label: p}))} placeholder="选择优先级" /></td>
        <td style={columnStyles[4]} className={getTdClassName(4, true)}><OkrMultiSelectCell selectedKrIds={project.keyResultIds} allOkrs={activeOkrs} onSave={(newKrIds) => handleUpdateField('keyResultIds', newKrIds)} isInvalid={isKrInvalid} /></td>
        <td style={columnStyles[5]} className={getTdClassName(5, true)}><RichTextInput html={project.weeklyUpdate} onChange={(val) => handleUpdateField('weeklyUpdate', val)} placeholder="本周进展/问题" /></td>
        <td style={columnStyles[6]} className={getTdClassName(6, true)}><div className="p-1.5 text-gray-400 dark:text-gray-500">上周无记录</div></td>
        
        {roleInfo.map(({ key, name }, index) => (
          <td key={key} style={columnStyles[7 + index]} className={getTdClassName(7 + index, true)}>
             <RoleCell team={project[key] as Role} allUsers={allUsers} onClick={() => handleOpenRoleModal(key, name)} />
          </td>
        ))}

        <td style={columnStyles[11]} className={getTdClassName(11, true)}><DatePicker selectedDate={project.proposedDate} onSelectDate={(val) => handleUpdateField('proposedDate', val)} /></td>
        <td style={columnStyles[12]} className={getTdClassName(12, true)}><DatePicker selectedDate={project.launchDate} onSelectDate={(val) => handleUpdateField('launchDate', val)} /></td>
        <td style={columnStyles[13]} className={getTdClassName(13, true)}>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onSave(project)} className="p-1 text-green-500 hover:text-green-400"><IconCheck className="w-5 h-5"/></button>
            <button onClick={() => onCancel(project.id)} className="p-1 text-red-500 hover:text-red-400"><IconX className="w-5 h-5"/></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-200 dark:border-[#363636] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] group transition-colors duration-200 relative">
        <td style={columnStyles[0]} className={getTdClassName(0)} onMouseEnter={(e) => onCellMouseEnter(e, project)} onMouseLeave={onCellMouseLeave}><EditableCell value={project.name} onSave={(val) => handleUpdateField('name', val)} /></td>
        <td style={columnStyles[1]} className={getTdClassName(1)} onMouseEnter={(e) => onCellMouseEnter(e, project)} onMouseLeave={onCellMouseLeave}><EditableCell value={project.businessProblem} onSave={(val) => handleUpdateField('businessProblem', val)} type="textarea" /></td>
        <td style={columnStyles[2]} className={getTdClassName(2)}><EditableCell value={project.status} onSave={(val) => handleUpdateField('status', val)} type="select" selectType="status" /></td>
        <td style={columnStyles[3]} className={getTdClassName(3)}><EditableCell value={project.priority} onSave={(val) => handleUpdateField('priority', val)} type="select" selectType="priority" /></td>
        <td style={columnStyles[4]} className={getTdClassName(4)}><OkrMultiSelectCell selectedKrIds={project.keyResultIds} allOkrs={activeOkrs} onSave={(newKrIds) => handleUpdateField('keyResultIds', newKrIds)} isInvalid={isKrInvalid} /></td>
        <td style={columnStyles[5]} className={getTdClassName(5)}><RichTextEditableCell html={project.weeklyUpdate} onSave={(val) => handleUpdateField('weeklyUpdate', val)} /></td>
        <td style={columnStyles[6]} className={getTdClassName(6)}>
            <div 
                dangerouslySetInnerHTML={{ __html: project.lastWeekUpdate || `<span class="text-gray-400 dark:text-gray-500">N/A</span>`}} 
                className="w-full h-full p-1.5 -m-1.5 whitespace-pre-wrap text-gray-500 dark:text-gray-400"
            />
        </td>

        {roleInfo.map(({ key, name }, index) => (
            <td key={key} style={columnStyles[7 + index]} className={getTdClassName(7 + index)}>
                <RoleCell team={project[key] as Role} allUsers={allUsers} onClick={() => handleOpenRoleModal(key, name)} />
            </td>
        ))}

        <td style={columnStyles[11]} className={getTdClassName(11)}><DatePicker selectedDate={project.proposedDate} onSelectDate={(val) => handleUpdateField('proposedDate', val)} /></td>
        <td style={columnStyles[12]} className={getTdClassName(12)}><DatePicker selectedDate={project.launchDate} onSelectDate={(val) => handleUpdateField('launchDate', val)} /></td>
        <td style={columnStyles[13]} className={getTdClassName(13)}>
          <div>
            <ActionsCell 
              project={project}
              currentUser={currentUser}
              onDelete={() => onDelete(project.id)}
              onToggleFollow={() => onToggleFollow(project.id)}
              onOpenModal={(type) => onOpenModal(type, project.id)}
            />
          </div>
        </td>
    </tr>
  );
});
ProjectRow.displayName = 'ProjectRow';


export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, allUsers, activeOkrs, currentUser, editingId, onSaveNewProject, onUpdateProject, onDeleteProject, onCancelNewProject, onOpenModal, onToggleFollow, onCreateProject }) => {
  const columnStyles = useMemo(() => {
    const leftOffsets: number[] = [0];
    for (let i = 0; i < leftStickyColumnCount - 1; i++) {
        leftOffsets.push(leftOffsets[i] + parseInt(tableHeaders[i].width, 10));
    }

    return tableHeaders.map((header, index) => {
        const style: React.CSSProperties = { width: header.width, minWidth: header.width };
        if (index < leftStickyColumnCount) {
            style.position = 'sticky';
            style.left = leftOffsets[index];
            style.zIndex = 1;
        }
        if (index >= tableHeaders.length - rightStickyColumnCount) {
            style.position = 'sticky';
            style.right = 0;
            style.zIndex = 1;
        }
        return style;
    });
  }, []);

  const [tooltipData, setTooltipData] = useState<{
    project: Project | null;
    targetRect: DOMRect | null;
  }>({ project: null, targetRect: null });
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleCellMouseEnter = (e: React.MouseEvent, project: Project) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      const target = e.currentTarget as HTMLElement;
      hoverTimeoutRef.current = window.setTimeout(() => {
          setTooltipData({
              project: project,
              targetRect: target.getBoundingClientRect(),
          });
      }, 300);
  };

  const handleCellMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setTooltipData({ project: null, targetRect: null });
  };

  const getTdClassName = (index: number, isNew = false) => {
      let classes = `${commonTdClass}`;
      if (index < leftStickyColumnCount) {
          classes += isNew ? ' bg-indigo-50 dark:bg-[#2a2a2a]' : ' bg-white dark:bg-[#232323] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a]';
      }
      if (index >= tableHeaders.length - rightStickyColumnCount) {
          classes += (isNew ? ' bg-indigo-50 dark:bg-[#2a2a2a]' : ' bg-white dark:bg-[#232323] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a]') + ' text-center';
      }
      if (index === leftStickyColumnCount - 1) {
          classes += ' border-r-2 border-gray-300 dark:border-[#4a4a4a]';
      }
      if (index === tableHeaders.length - rightStickyColumnCount) {
          classes += ' border-l-2 border-gray-300 dark:border-[#4a4a4a]';
      }
      return classes;
  };
  
  const getThClassName = (index: number) => {
    let classes = "text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase p-4 border-b border-t border-gray-200 dark:border-[#363636] align-middle bg-gray-50 dark:bg-[#2a2a2a]";
    if (index === leftStickyColumnCount - 1) {
        classes += ' border-r-2 border-gray-300 dark:border-[#4a4a4a]';
    }
    if (index === tableHeaders.length - rightStickyColumnCount) {
        classes += ' border-l-2 border-gray-300 dark:border-[#4a4a4a]';
    }
    return classes;
  };
  
  const getThStyle = (index: number): React.CSSProperties => {
      const style = { ...columnStyles[index] };
      if (style.position === 'sticky') {
          style.zIndex = 2; // Header on top
      }
      return style;
  };

  return (
    <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead className="sticky top-0 z-10">
          <tr>
            {tableHeaders.map((header, index) => (
              <th key={header.key} style={getThStyle(index)} className={getThClassName(index)}>
                {header.key === 'name' ? (
                  <div className="flex items-center justify-between">
                    <span>{header.label}</span>
                    <button
                      onClick={onCreateProject}
                      className="ml-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#6C63FF] text-white rounded-md text-xs font-medium hover:bg-[#5a52d9] transition-all duration-200 shadow-sm hover:shadow-md"
                      title="创建新项目"
                    >
                      <IconPlus className="w-3.5 h-3.5" />
                      <span>新建</span>
                    </button>
                  </div>
                ) : (
                  header.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-[#363636]">
          {projects.map(project => (
            <ProjectRow
              key={project.id}
              project={project}
              allUsers={allUsers}
              activeOkrs={activeOkrs}
              currentUser={currentUser}
              onSave={onSaveNewProject}
              onUpdateProject={onUpdateProject}
              onDelete={onDeleteProject}
              onCancel={onCancelNewProject}
              onOpenModal={onOpenModal}
              onToggleFollow={onToggleFollow}
              columnStyles={columnStyles}
              getTdClassName={getTdClassName}
              onCellMouseEnter={handleCellMouseEnter}
              onCellMouseLeave={handleCellMouseLeave}
            />
          ))}
        </tbody>
      </table>
      {tooltipData.project && tooltipData.targetRect && (
          <TooltipPortal targetRect={tooltipData.targetRect}>
              <TeamScheduleTooltip project={tooltipData.project} allUsers={allUsers} />
          </TooltipPortal>
      )}
    </div>
  );
};