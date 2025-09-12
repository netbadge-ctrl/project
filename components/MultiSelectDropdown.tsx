import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { IconChevronDown, IconSearch } from './Icons';
import { fuzzySearch } from '../utils';

interface Option {
    value: string;
    label: string;
    email?: string; // 添加邮箱字段用于拼音匹配
}

interface GroupedOption {
    label: string;
    options: Option[];
}

interface MultiSelectDropdownProps {
    options?: Option[];
    groupedOptions?: GroupedOption[];
    selectedValues: string[];
    onSelectionChange: (newSelectedValues: string[]) => void;
    placeholder: string;
    userData?: Array<{ id: string; name: string; email: string }>; // 添加用户数据
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    options = [],
    groupedOptions,
    selectedValues,
    onSelectionChange,
    placeholder,
    userData = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // 预缓存选项数据，避免每次搜索时重复处理
    const processedOptions = useMemo(() => {
        const allOptions = groupedOptions ? groupedOptions.flatMap(g => g.options) : options;
        return allOptions.map(option => {
            // 从userData中查找对应的邮箱信息
            const user = userData.find(u => u.id === option.value);
            const emailPrefix = user?.email ? user.email.split('@')[0].toLowerCase() : '';
            
            return {
                ...option,
                searchableText: option.label.toLowerCase(),
                emailPrefix: emailPrefix
            };
        });
    }, [options, groupedOptions, userData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 完全移除防抖，直接使用搜索词
    useEffect(() => {
        setDebouncedSearchTerm(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setDebouncedSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleToggleOption = useCallback((value: string) => {
        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onSelectionChange(newSelectedValues);
    }, [selectedValues, onSelectionChange]);

    const displayLabel = selectedValues.length > 0 
        ? `${placeholder} (${selectedValues.length})`
        : placeholder;

    const { flatFilteredOptions, filteredGroupedOptions } = useMemo(() => {
        // 如果没有搜索词，直接返回所有选项
        if (!debouncedSearchTerm.trim()) {
            if (groupedOptions) {
                return {
                    flatFilteredOptions: groupedOptions.flatMap(g => g.options),
                    filteredGroupedOptions: groupedOptions,
                };
            }
            return {
                flatFilteredOptions: options,
                filteredGroupedOptions: null
            };
        }

        const searchLower = debouncedSearchTerm.toLowerCase();
        
        // 极速搜索：使用indexOf代替includes，更快
        const filtered = [];
        for (let i = 0; i < processedOptions.length; i++) {
            const option = processedOptions[i];
            // 姓名匹配 - 使用indexOf比includes更快
            if (option.searchableText.indexOf(searchLower) !== -1) {
                filtered.push(option);
                continue;
            }
            // 邮箱前缀匹配
            if (option.emailPrefix && option.emailPrefix.indexOf(searchLower) !== -1) {
                filtered.push(option);
            }
        }
        
        if (groupedOptions) {
            // 创建快速查找Set
            const filteredValueSet = new Set(filtered.map(f => f.value));
            const filteredGroups = [];
            
            for (let i = 0; i < groupedOptions.length; i++) {
                const group = groupedOptions[i];
                const groupOptions = [];
                
                for (let j = 0; j < group.options.length; j++) {
                    if (filteredValueSet.has(group.options[j].value)) {
                        groupOptions.push(group.options[j]);
                    }
                }
                
                if (groupOptions.length > 0) {
                    filteredGroups.push({
                        ...group,
                        options: groupOptions
                    });
                }
            }
            
            return {
                flatFilteredOptions: filtered,
                filteredGroupedOptions: filteredGroups,
            };
        }
        
        return {
            flatFilteredOptions: filtered,
            filteredGroupedOptions: null
        };
    }, [processedOptions, groupedOptions, debouncedSearchTerm]);

    const areAllFilteredSelected = useMemo(() => {
        if (flatFilteredOptions.length === 0) return false;
        return flatFilteredOptions.every(o => selectedValues.includes(o.value));
    }, [flatFilteredOptions, selectedValues]);

    const handleToggleAll = useCallback(() => {
        const allFilteredValues = flatFilteredOptions.map(o => o.value);
        if (areAllFilteredSelected) {
            // Deselect all filtered
            const filteredValuesSet = new Set(allFilteredValues);
            onSelectionChange(selectedValues.filter(v => !filteredValuesSet.has(v)));
        } else {
            // Select all filtered
            onSelectionChange([...new Set([...selectedValues, ...allFilteredValues])]);
        }
    }, [flatFilteredOptions, areAllFilteredSelected, selectedValues, onSelectionChange]);
    
    const renderOption = (option: Option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
            <li key={option.value}>
                <label className={`group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected 
                        ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-[#6C63FF] dark:text-[#A29DFF] font-medium shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3a3a3a] hover:shadow-sm border border-transparent'
                }`}>
                    <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        isSelected 
                            ? 'bg-[#6C63FF] border-[#6C63FF] shadow-sm' 
                            : 'bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-gray-600 group-hover:border-[#6C63FF]/50'
                    }`}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleOption(option.value)}
                        className="sr-only"
                    />
                    <span className="flex-grow leading-relaxed">{option.label}</span>
                    {isSelected && (
                        <div className="w-2 h-2 bg-[#6C63FF] rounded-full flex-shrink-0 animate-pulse"></div>
                    )}
                </label>
            </li>
        );
    };

    const isActive = selectedValues.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative border rounded-lg px-3 py-2.5 w-full min-w-[120px] text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                    isActive
                    ? 'bg-[#6C63FF]/10 border-[#6C63FF]/40 text-[#6C63FF] dark:text-[#A29DFF] shadow-[#6C63FF]/20'
                    : 'bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#4a4a4a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3a3a3a] hover:border-gray-400 dark:hover:border-[#5a5a5a]'
                } ${isOpen ? 'ring-2 ring-[#6C63FF] ring-offset-2 shadow-lg' : ''}`}
            >
                <span className="font-medium truncate pr-2">{displayLabel}</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    {isActive && (
                        <div className="w-2 h-2 bg-[#6C63FF] rounded-full animate-pulse"></div>
                    )}
                    <IconChevronDown className={`w-4 h-4 transition-all duration-300 ${
                        isOpen ? 'rotate-180 text-[#6C63FF]' : 'group-hover:text-[#6C63FF]'
                    }`} />
                </div>
                
                {/* 视觉提示：展开状态指示器 */}
                {isOpen && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#6C63FF]"></div>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-80 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-xl shadow-2xl z-[9999] flex flex-col max-h-[70vh] min-h-[200px] left-0">
                    {/* 搜索区域 */}
                    <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-[#4a4a4a] bg-gray-50 dark:bg-[#232323] rounded-t-xl">
                        <div className="relative">
                           <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                           <input
                             ref={searchInputRef}
                             type="text"
                             placeholder="搜索选项..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-lg pl-10 pr-4 py-2.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] transition-all"
                           />
                        </div>
                    </div>
                    
                    {/* 全选/取消全选按钮 */}
                    {flatFilteredOptions.length > 0 && (
                        <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-[#4a4a4a] bg-gray-50 dark:bg-[#232323]">
                            <button
                                onClick={handleToggleAll}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-[#6C63FF] rounded-lg hover:bg-[#5a52d9] focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 transition-all duration-200 shadow-sm"
                            >
                                {areAllFilteredSelected ? '取消全选' : '全部选择'}
                            </button>
                        </div>
                    )}
                    
                    {/* 选项列表区域 - 自适应高度 */}
                    <div className="flex-grow overflow-hidden flex flex-col">
                        <ul className="flex-grow overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'calc(70vh - 140px)' }}>
                            {filteredGroupedOptions ? (
                                filteredGroupedOptions.map(group => (
                                    <li key={group.label} className="mb-3">
                                        <div className="sticky top-0 bg-white dark:bg-[#2d2d2d] px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-[#3a3a3a] mb-2">
                                            {group.label}
                                        </div>
                                        <ul className="space-y-1">
                                            {group.options.map(renderOption)}
                                        </ul>
                                    </li>
                                ))
                            ) : (
                                flatFilteredOptions.map(renderOption)
                            )}
                            
                            {flatFilteredOptions.length === 0 && (
                                <li className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-3">
                                        <IconSearch className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium">无匹配选项</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">尝试调整搜索条件</p>
                                </li>
                            )}
                        </ul>
                        
                        {/* 滚动提示 */}
                        {flatFilteredOptions.length > 8 && (
                            <div className="flex-shrink-0 px-3 py-2 bg-gradient-to-t from-white dark:from-[#2d2d2d] to-transparent">
                                <div className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                                    <span>滚动查看更多选项</span>
                                    <div className="ml-2 flex space-x-1">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};