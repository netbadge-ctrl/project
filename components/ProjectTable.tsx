import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Project, User, ProjectStatus, ProjectRoleKey, OKR, Priority, Role } from '../types';
import { IconTrash, IconCheck, IconX, IconMoreHorizontal, IconStar, IconMessageCircle, IconHistory, IconChevronDown, IconPlus } from './Icons';
import { RoleCell } from './RoleCell';
import { ConfirmDialog } from './ConfirmDialog';
import { DatePicker } from './DatePicker';
import { RichTextInput } from './RichTextInput';
import { RichTextEditableCell } from './RichTextEditableCell';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { AutoResizeInput } from './AutoResizeInput';
import { TruncatedText } from './TruncatedText';
import { TooltipPortal } from './TooltipPortal';
import { TeamScheduleTooltip } from './TeamScheduleTooltip';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import KRSelectionModal from './KRSelectionModal';
import { formatDateOnly, debounce } from '../utils';

type SortField = 'name' | 'status' | 'priority' | 'createdAt' | 'proposedDate' | 'launchDate';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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
  sortConfig?: SortConfig;
  onSort?: (field: SortField) => void;
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

const commonTdClass = "px-4 py-2 text-sm text-gray-700 dark:text-gray-300 align-middle border-b border-gray-200 dark:border-[#363636]";
const editInputClass = "bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-2 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]";
const editTextAreaClass = `${editInputClass} min-h-[80px] whitespace-pre-wrap resize-y`;

const leftStickyColumnCount = 3;
const rightStickyColumnCount = 1;


const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const priorityStyles: Record<Priority, string> = {
        [Priority.DeptOKR]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/70 dark:text-red-200 dark:border-red-500/80',
        [Priority.PersonalOKR]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/70 dark:text-orange-200 dark:border-orange-500/80',
        [Priority.UrgentRequirement]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/70 dark:text-yellow-200 dark:border-yellow-500/80',
        [Priority.LowPriority]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/70 dark:text-blue-200 dark:border-blue-500/80',
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
    [ProjectStatus.ProductDesign]: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-600/50 dark:text-indigo-300 dark:border-indigo-500/60',
    [ProjectStatus.RequirementsDone]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-600/50 dark:text-blue-300 dark:border-blue-500/60',
    [ProjectStatus.ReviewDone]: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-600/50 dark:text-cyan-300 dark:border-cyan-500/60',
    [ProjectStatus.InProgress]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-600/50 dark:text-orange-300 dark:border-orange-500/60',
    [ProjectStatus.DevDone]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-600/50 dark:text-yellow-300 dark:border-yellow-500/60',
    [ProjectStatus.Testing]: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-600/50 dark:text-pink-300 dark:border-pink-500/60',
    [ProjectStatus.TestDone]: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-600/50 dark:text-teal-300 dark:border-teal-500/60',
    [ProjectStatus.LaunchedThisWeek]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-600/50 dark:text-emerald-300 dark:border-emerald-500/60',
    [ProjectStatus.Completed]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-600/50 dark:text-green-300 dark:border-green-500/60',
    [ProjectStatus.Paused]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-600/50 dark:text-red-300 dark:border-red-500/60',
    [ProjectStatus.ProjectInProgress]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-600/50 dark:text-amber-300 dark:border-amber-500/60',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const EditableCell = ({ value, onSave, type = 'text', className = '', options, displayValue, selectType } : { value: string, onSave: (value: any) => void, type?: 'text' | 'textarea' | 'select', className?: string, options?: {value: string, label: string}[], displayValue?: string, selectType?: 'status' | 'priority' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 自动调整高度函数
    const autoResize = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    };
    
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
                // 如果是textarea，自动调整高度
                if (type === 'textarea' && textareaRef.current) {
                    autoResize(textareaRef.current);
                }
            }
        }
    }, [isEditing, type]);

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
                // 对于textarea，Enter键直接换行，Ctrl+Enter或Cmd+Enter保存
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    handleSave();
                }
                // 普通Enter键允许换行（默认行为）
            } else {
                // 对于普通input，Enter直接保存
                e.preventDefault();
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
        return value || <span className="text-gray-400 dark:text-gray-500">-</span>;
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
            return (
                <AutoResizeTextarea
                    value={currentValue}
                    onChange={setCurrentValue}
                    placeholder="请输入内容..."
                    className={`${editInputClass} ${className}`}
                    minRows={2}
                    maxRows={10}
                    onSave={handleSave}
                    onCancel={() => {
                        setCurrentValue(value);
                        setIsEditing(false);
                    }}
                />
            );
        }
        
        // 对于普通文本输入，也使用自动调整高度的组件
        return (
            <AutoResizeInput
                value={currentValue}
                onChange={setCurrentValue}
                placeholder="请输入内容..."
                className={`${editInputClass} ${className}`}
                minRows={1}
                maxRows={3}
                onSave={handleSave}
                onCancel={() => {
                    setCurrentValue(value);
                    setIsEditing(false);
                }}
                onKeyDown={handleKeyDown}
            />
        );
    }
    
    return (
        <div onClick={() => setIsEditing(true)} className={`w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center ${className}`}>
            {type === 'textarea' ? (
                <TruncatedText 
                    text={renderValue() as string} 
                    maxLines={5} 
                    className="whitespace-pre-wrap table-cell-content w-full"
                    showTooltip={true}
                />
            ) : (
                <div className="whitespace-pre-wrap table-cell-content">{renderValue()}</div>
            )}
        </div>
    );
};


const OkrMultiSelectCell: React.FC<{
  selectedKrIds: string[];
  allOkrs: OKR[];
  onSave: (newKrIds: string[]) => void;
  isInvalid?: boolean;
}> = ({ selectedKrIds, allOkrs, onSave, isInvalid = false }) => {
  console.log('🔧 OkrMultiSelectCell render:', { selectedKrIds, allOkrs: allOkrs?.length });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 构建 KR 映射，支持简单ID和复合ID
  const { allKrsMap } = useMemo(() => {
    const krMap = new Map<string, { description: string; oNumber: number; krNumber: number; objective: string; okrId: string }>();
    console.log('🔧 OkrMultiSelectCell building KR map from OKRs:', allOkrs);
    
    (allOkrs || []).forEach((okr, okrIndex) => {
      console.log('🔧 Processing OKR:', { okrIndex, okr });
      (okr.keyResults || []).forEach((kr, krIndex) => {
        const krData = {
          description: kr.description,
          oNumber: okrIndex + 1,
          krNumber: krIndex + 1,
          objective: okr.objective,
          okrId: okr.id
        };
        console.log('🔧 Adding KR to map:', { krId: kr.id, krData });
        
        // 为简单ID创建映射（向后兼容）
        krMap.set(kr.id, krData);
        
        // 为复合ID创建映射（新格式）
        const compositeId = `${okr.id}::${kr.id}`;
        krMap.set(compositeId, krData);
      });
    });
    
    console.log('🔧 Final KR map:', krMap);
    return { allKrsMap: krMap };
  }, [allOkrs]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = (newKrIds: string[]) => {
    console.log('🔧 OkrMultiSelectCell - handleSave called with:', newKrIds);
    console.log('🔧 OkrMultiSelectCell - Current selectedKrIds:', selectedKrIds);
    console.log('🔧 OkrMultiSelectCell - Changes detected:', JSON.stringify(selectedKrIds) !== JSON.stringify(newKrIds));
    console.log('🔧 OkrMultiSelectCell - Calling onSave with:', newKrIds);
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
          <span className="text-gray-400 dark:text-gray-500">-</span>
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
        triggerRef={triggerRef}
        useDropdown={true}
      />

      {/* Hover Tooltip */}
      {isHovering && !isModalOpen && (selectedKrIds || []).length > 0 && triggerRef.current && (
        <TooltipPortal targetRect={triggerRef.current.getBoundingClientRect()}>
          <div className="bg-gray-800/95 dark:bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl w-80 text-sm space-y-2 border border-white/10">
            <h3 className="font-bold mb-2 border-b border-gray-600 pb-1.5">关联的关键成果 (KR)</h3>
            <ul className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
              {(selectedKrIds || []).map(krId => {
                // 处理新的复合ID格式和旧的简单ID格式
                let krDetails = null;
                
                if (krId.includes('::')) {
                  // 复合ID格式，直接查找
                  krDetails = allKrsMap.get(krId);
                } else {
                  // 简单ID格式，需要智能匹配正确的OKR
                  // 由于数据中存在重复的KR ID，我们需要通过上下文来决定使用哪个
                  // 暂时使用第一个匹配的KR（这是一个临时解决方案）
                  krDetails = allKrsMap.get(krId);
                }
                
                console.log('🔧 Tooltip KR Details:', { krId, krDetails });
                
                if (!krDetails) {
                  console.warn('🚨 未找到KR详情:', krId);
                  return null;
                }
                
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
    const isFollowing = currentUser && (project.followers || []).includes(currentUser.id);

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

  // 新建项目的本地状态
  const [localProject, setLocalProject] = useState<Project>(project);
  // 防重复保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 当项目prop变化时更新本地状态 - 优化依赖
  useEffect(() => {
    if (project.isNew) {
      // 对于新项目，只在初始化时设置，之后保留本地状态避免重置用户输入
      setLocalProject(prev => {
        // 如果是第一次初始化（prev的id与project的id不同），则使用project数据
        if (prev.id !== project.id) {
          return project;
        }
        // 否则保留本地状态，但要同步团队成员数据的变化
        // 检查团队成员数据是否有变化，如果有变化则更新
        const hasRoleChanges = 
          JSON.stringify(prev.productManagers) !== JSON.stringify(project.productManagers) ||
          JSON.stringify(prev.backendDevelopers) !== JSON.stringify(project.backendDevelopers) ||
          JSON.stringify(prev.frontendDevelopers) !== JSON.stringify(project.frontendDevelopers) ||
          JSON.stringify(prev.qaTesters) !== JSON.stringify(project.qaTesters);
        
        if (hasRoleChanges) {
          return {
            ...prev,
            productManagers: project.productManagers,
            backendDevelopers: project.backendDevelopers,
            frontendDevelopers: project.frontendDevelopers,
            qaTesters: project.qaTesters,
          };
        }
        
        return prev;
      });
    } else {
      // 对于现有项目，直接使用新的项目数据
      setLocalProject(project);
    }
  }, [project.id, project.isNew, project.productManagers, project.backendDevelopers, project.frontendDevelopers, project.qaTesters]); // 添加团队成员字段到依赖

  // 使用 useCallback 优化回调函数
  const handleUpdateField = useCallback((field: keyof Project, value: any) => {
    console.log('🔧 ProjectTable - handleUpdateField called:', { field, value, isNew: project.isNew });
    
    if (project.isNew) {
      // 新建项目：更新本地状态，同时同步到全局状态
      const updatedProject = { ...localProject, [field]: value };
      console.log('🔧 ProjectTable - Updating new project local state:', updatedProject);
      setLocalProject(updatedProject);
      // 同步到全局状态，确保保存时能获取到最新数据
      onUpdateProject(project.id, field, value);
    } else {
      // 现有项目：立即保存
      console.log('🔧 ProjectTable - Updating existing project:', { projectId: project.id, field, value });
      onUpdateProject(project.id, field, value);
    }
  }, [project.isNew, project.id, localProject, onUpdateProject]);

  const handleSaveNewProject = useCallback(async () => {
    if (isSaving) return; // 防止重复点击
    
    setIsSaving(true);
    try {
      // 保存时使用本地状态的数据
      await onSave(localProject);
    } finally {
      setIsSaving(false);
    }
  }, [localProject, onSave, isSaving]);

  // 使用 useMemo 缓存静态数据
  const roleInfo = useMemo(() => [
      { key: 'productManagers' as ProjectRoleKey, name: '产品经理' },
      { key: 'backendDevelopers' as ProjectRoleKey, name: '后端研发' },
      { key: 'frontendDevelopers' as ProjectRoleKey, name: '前端研发' },
      { key: 'qaTesters' as ProjectRoleKey, name: '测试' },
  ], []);

  const handleOpenRoleModal = useCallback((roleKey: ProjectRoleKey, roleName: string) => {
      onOpenModal('role', project.id, { roleKey, roleName });
  }, [onOpenModal, project.id]);
  
  const isKrInvalid = false; // 移除KR关联校验限制

  const getTdStyle = (index: number): React.CSSProperties => {
      const style = { ...columnStyles[index] };
      // 强制添加底部边框，确保显示
      style.borderBottom = '1px solid rgb(229 231 235)'; // gray-200
      return style;
  };

  if (project.isNew) {
    return (
      <tr className="bg-indigo-50 dark:bg-[#2a2a2a]/50 relative">
        <td style={getTdStyle(0)} className={getTdClassName(0, true)}>
          <AutoResizeInput
            value={localProject.name}
            onChange={(val) => handleUpdateField('name', val)}
            placeholder="新项目名称"
            className={editInputClass}
            minRows={1}
            maxRows={3}
          />
        </td>
        <td style={getTdStyle(1)} className={getTdClassName(1, true)}>
          <AutoResizeTextarea
            value={localProject.businessProblem}
            onChange={(val) => handleUpdateField('businessProblem', val)}
            placeholder="解决的核心业务问题"
            className={editInputClass}
            minRows={2}
            maxRows={8}
          />
        </td>
        <td style={getTdStyle(2)} className={getTdClassName(2, true)}><InlineSelect value={localProject.status} onSave={(v) => handleUpdateField('status', v)} options={Object.values(ProjectStatus).map(s => ({value: s, label: s}))} placeholder="选择状态" /></td>
        <td style={getTdStyle(3)} className={getTdClassName(3, true)}><InlineSelect value={localProject.priority} onSave={(v) => handleUpdateField('priority', v)} options={Object.values(Priority).map(p => ({value: p, label: p}))} placeholder="选择优先级" /></td>
        <td style={getTdStyle(4)} className={getTdClassName(4, true)}><OkrMultiSelectCell selectedKrIds={localProject.keyResultIds} allOkrs={activeOkrs} onSave={(newKrIds) => handleUpdateField('keyResultIds', newKrIds)} isInvalid={isKrInvalid} /></td>
        <td style={getTdStyle(5)} className={getTdClassName(5, true)}><RichTextInput html={localProject.weeklyUpdate} onChange={(val) => handleUpdateField('weeklyUpdate', val)} placeholder="本周进展/问题" /></td>
        <td style={getTdStyle(6)} className={getTdClassName(6, true)}><div className="p-1.5 text-gray-400 dark:text-gray-500">上周无记录</div></td>
        
        {roleInfo.map(({ key, name }, index) => (
          <td key={key} style={getTdStyle(7 + index)} className={getTdClassName(7 + index, true)}>
             <RoleCell team={localProject[key] as Role} allUsers={allUsers} onClick={() => handleOpenRoleModal(key, name)} />
          </td>
        ))}

        <td style={getTdStyle(11)} className={getTdClassName(11, true)}><DatePicker selectedDate={localProject.proposedDate} onSelectDate={(val) => handleUpdateField('proposedDate', val)} /></td>
        <td style={getTdStyle(12)} className={getTdClassName(12, true)}><DatePicker selectedDate={localProject.launchDate} onSelectDate={(val) => handleUpdateField('launchDate', val)} align="right" /></td>
        <td style={getTdStyle(13)} className={getTdClassName(13, true)}>
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={handleSaveNewProject} 
              disabled={isSaving}
              className={`p-1 ${isSaving ? 'text-gray-400 cursor-not-allowed' : 'text-green-500 hover:text-green-400'}`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
              ) : (
                <IconCheck className="w-5 h-5"/>
              )}
            </button>
            <button onClick={() => onCancel(project.id)} className="p-1 text-red-500 hover:text-red-400"><IconX className="w-5 h-5"/></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr 
      className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] group transition-colors duration-200 relative"
      style={{ 
        transform: 'translate3d(0, 0, 0)', // 硬件加速
        backfaceVisibility: 'hidden',
        contain: 'layout style paint' // 限制重排重绘范围
      }}
    >
        <td style={getTdStyle(0)} className={getTdClassName(0)} onMouseEnter={(e) => onCellMouseEnter(e, project)} onMouseLeave={onCellMouseLeave}><EditableCell value={project.name} onSave={(val) => handleUpdateField('name', val)} /></td>
        <td style={getTdStyle(1)} className={getTdClassName(1)} onMouseEnter={(e) => onCellMouseEnter(e, project)} onMouseLeave={onCellMouseLeave}><EditableCell value={project.businessProblem} onSave={(val) => handleUpdateField('businessProblem', val)} type="textarea" /></td>
        <td style={getTdStyle(2)} className={getTdClassName(2)}><EditableCell value={project.status} onSave={(val) => handleUpdateField('status', val)} type="select" selectType="status" /></td>
        <td style={getTdStyle(3)} className={getTdClassName(3)}><EditableCell value={project.priority} onSave={(val) => handleUpdateField('priority', val)} type="select" selectType="priority" /></td>
        <td style={getTdStyle(4)} className={getTdClassName(4)}><OkrMultiSelectCell selectedKrIds={project.keyResultIds} allOkrs={activeOkrs} onSave={(newKrIds) => handleUpdateField('keyResultIds', newKrIds)} isInvalid={isKrInvalid} /></td>
        <td style={getTdStyle(5)} className={getTdClassName(5)}><RichTextEditableCell html={project.weeklyUpdate} onSave={(val) => handleUpdateField('weeklyUpdate', val)} /></td>
        <td style={getTdStyle(6)} className={getTdClassName(6)}>
            <div className="w-full h-full p-1.5 -m-1.5 cursor-pointer rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center">
                {project.lastWeekUpdate ? (
                    <TruncatedText 
                        text={project.lastWeekUpdate.replace(/<[^>]*>/g, '')} 
                        maxLines={5} 
                        className="whitespace-pre-wrap table-cell-content w-full text-gray-500 dark:text-gray-400"
                        showTooltip={true}
                    />
                ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                )}
            </div>
        </td>

        {roleInfo.map(({ key, name }, index) => (
            <td key={key} style={getTdStyle(7 + index)} className={getTdClassName(7 + index)}>
                <RoleCell team={project[key] as Role} allUsers={allUsers} onClick={() => handleOpenRoleModal(key, name)} />
            </td>
        ))}

        <td style={getTdStyle(11)} className={getTdClassName(11)}><DatePicker selectedDate={project.proposedDate} onSelectDate={(val) => handleUpdateField('proposedDate', val)} /></td>
        <td style={getTdStyle(12)} className={getTdClassName(12)}><DatePicker selectedDate={project.launchDate} onSelectDate={(val) => handleUpdateField('launchDate', val)} align="right" /></td>
        <td style={getTdStyle(13)} className={getTdClassName(13)}>
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
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.priority === nextProps.project.priority &&
    prevProps.project.businessProblem === nextProps.project.businessProblem &&
    prevProps.project.weeklyUpdate === nextProps.project.weeklyUpdate &&
    prevProps.project.lastWeekUpdate === nextProps.project.lastWeekUpdate &&
    prevProps.project.proposedDate === nextProps.project.proposedDate &&
    prevProps.project.launchDate === nextProps.project.launchDate &&
    prevProps.project.isNew === nextProps.project.isNew &&
    JSON.stringify(prevProps.project.keyResultIds) === JSON.stringify(nextProps.project.keyResultIds) &&
    JSON.stringify(prevProps.project.productManagers) === JSON.stringify(nextProps.project.productManagers) &&
    JSON.stringify(prevProps.project.backendDevelopers) === JSON.stringify(nextProps.project.backendDevelopers) &&
    JSON.stringify(prevProps.project.frontendDevelopers) === JSON.stringify(nextProps.project.frontendDevelopers) &&
    JSON.stringify(prevProps.project.qaTesters) === JSON.stringify(nextProps.project.qaTesters) &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.editingId === nextProps.editingId &&
    prevProps.allUsers.length === nextProps.allUsers.length &&
    prevProps.activeOkrs.length === nextProps.activeOkrs.length
  );
});
ProjectRow.displayName = 'ProjectRow';


export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, allUsers, activeOkrs, currentUser, editingId, onSaveNewProject, onUpdateProject, onDeleteProject, onCancelNewProject, onOpenModal, onToggleFollow, onCreateProject, sortConfig, onSort }) => {
  // 滚动性能优化：使用 RAF 和防抖
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const rafRef = useRef<number>();

  // 虚拟滚动相关状态
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(50, projects.length) });
  const ROW_HEIGHT = 80; // 估算的行高
  const BUFFER_SIZE = 10; // 缓冲区大小

  const handleScroll = useCallback(() => {
    // 取消之前的 RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // 使用 RAF 确保在下一帧处理滚动
    rafRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (container && projects.length > 50) { // 只在大量数据时启用虚拟滚动
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // 计算可见范围
        const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
        const endIndex = Math.min(
          projects.length,
          Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE
        );
        
        setVisibleRange({ start: startIndex, end: endIndex });
      }
      
      if (!isScrolling) {
        setIsScrolling(true);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 100);
    });
  }, [isScrolling, projects.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [handleScroll]);

  // 计算虚拟滚动的可见项目
  const visibleProjects = useMemo(() => {
    if (projects.length <= 50) {
      return projects; // 少量数据时不使用虚拟滚动
    }
    return projects.slice(visibleRange.start, visibleRange.end);
  }, [projects, visibleRange]);

  // 计算虚拟滚动的偏移量
  const virtualScrollOffset = projects.length > 50 ? visibleRange.start * ROW_HEIGHT : 0;
  const totalHeight = projects.length > 50 ? projects.length * ROW_HEIGHT : 'auto';

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
            style.zIndex = 5;
        }
        if (index >= tableHeaders.length - rightStickyColumnCount) {
            style.position = 'sticky';
            style.right = 0;
            style.zIndex = 5;
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
      // 为状态列(index=2)和优先级列(index=3)添加防止折行的样式
      if (index === 2) {
          classes += ' whitespace-nowrap status-cell';
      }
      if (index === 3) {
          classes += ' whitespace-nowrap priority-cell';
      }
      return classes;
  };

  const getThClassName = (index: number) => {
    // 需要居中的字段索引：产品经理(7)、后端研发(8)、前端研发(9)、测试(10)、提出时间(11)、上线时间(12)
    const centerAlignedColumns = [7, 8, 9, 10, 11, 12];
    const textAlign = centerAlignedColumns.includes(index) ? 'text-center' : 'text-left';
    
    let classes = `${textAlign} text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase p-4 border-b border-t border-gray-200 dark:border-[#363636] align-middle bg-gray-50 dark:bg-[#2a2a2a]`;
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
          // 表头的固定列需要更高的z-index，确保在所有内容之上
          style.zIndex = 15;
      } else {
          // 非固定列的表头也需要足够高的z-index
          style.zIndex = 12;
      }
      return style;
  };

  return (
    <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl h-full flex flex-col overflow-hidden project-table">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto" 
        data-table-container="true" 
        style={{ 
          scrollBehavior: 'auto', // 改为 auto 避免平滑滚动导致的性能问题
          transform: 'translate3d(0, 0, 0)', // 强制硬件加速
          backfaceVisibility: 'hidden', // 优化渲染
          perspective: '1000px', // 启用 3D 渲染上下文
          willChange: 'scroll-position, transform', // 提前告知浏览器优化
          contain: 'layout style paint' // 限制重排重绘范围
        }}
      >
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-20">
            <tr>
              {tableHeaders.map((header, index) => {
                const isSortable = ['name', 'status', 'priority', 'proposedDate', 'launchDate'].includes(header.key);
                const isActive = sortConfig?.field === header.key;
                const sortDirection = isActive ? sortConfig.direction : null;
                
                return (
                  <th key={header.key} style={getThStyle(index)} className={getThClassName(index)}>
                    {header.key === 'name' ? (
                      <div className="flex items-center justify-between">
                        <div 
                          className={`flex items-center gap-1 ${isSortable && onSort ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                          onClick={() => isSortable && onSort && onSort(header.key as SortField)}
                        >
                          <span>{header.label}</span>
                          {isSortable && onSort && (
                            <span className="ml-1">
                              {isActive ? (
                                sortDirection === 'asc' ? (
                                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )
                              ) : (
                                <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
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
                      <div 
                        className={`flex items-center gap-1 ${[7, 8, 9, 10, 11, 12].includes(index) ? 'justify-center' : ''} ${isSortable && onSort ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                        onClick={() => isSortable && onSort && onSort(header.key as SortField)}
                      >
                        <span>{header.label}</span>
                        {isSortable && onSort && (
                          <span className="ml-1">
                            {isActive ? (
                              sortDirection === 'asc' ? (
                                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )
                            ) : (
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody 
            style={{ 
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)', // 硬件加速
              backfaceVisibility: 'hidden',
              contain: 'layout style paint', // 限制重排重绘
              height: totalHeight,
              position: 'relative'
            }}
          >
            {/* 虚拟滚动占位符 */}
            {projects.length > 50 && virtualScrollOffset > 0 && (
              <tr style={{ height: virtualScrollOffset }}>
                <td colSpan={tableHeaders.length}></td>
              </tr>
            )}
            
            {/* 渲染可见的项目行 */}
            {visibleProjects.map((project, index) => (
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
            
            {/* 虚拟滚动底部占位符 */}
            {projects.length > 50 && visibleRange.end < projects.length && (
              <tr style={{ height: (projects.length - visibleRange.end) * ROW_HEIGHT }}>
                <td colSpan={tableHeaders.length}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {tooltipData.project && tooltipData.targetRect && (
          <TooltipPortal targetRect={tooltipData.targetRect}>
              <TeamScheduleTooltip project={tooltipData.project} allUsers={allUsers} />
          </TooltipPortal>
      )}
    </div>
  );
};