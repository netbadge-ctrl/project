import React, { useState, useRef, useEffect } from 'react';
import { useFilterState } from '../context/FilterStateContext';
import { EnhancedDateRangePicker } from './EnhancedDateRangePicker';
import { ChevronDownIcon, XMarkIcon, FunnelIcon } from './Icons';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface EnhancedFilterBarProps {
  // 筛选选项配置
  statusOptions?: FilterOption[];
  priorityOptions?: FilterOption[];
  ownerOptions?: FilterOption[];
  krOptions?: FilterOption[];
  
  // 显示控制
  showDateRange?: boolean;
  showStatusFilter?: boolean;
  showPriorityFilter?: boolean;
  showOwnerFilter?: boolean;
  showKrFilter?: boolean;
  showCommentsFilter?: boolean;
  
  // 回调函数
  onFiltersChange?: () => void;
  
  // 样式配置
  compact?: boolean;
  className?: string;
}

export const EnhancedFilterBar: React.FC<EnhancedFilterBarProps> = ({
  statusOptions = [],
  priorityOptions = [],
  ownerOptions = [],
  krOptions = [],
  showDateRange = true,
  showStatusFilter = true,
  showPriorityFilter = true,
  showOwnerFilter = true,
  showKrFilter = true,
  showCommentsFilter = true,
  onFiltersChange,
  compact = false,
  className = '',
}) => {
  const { state, updateProjectListFilters } = useFilterState();
  const filters = state.projectList;
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        const dropdown = dropdownRefs.current[openDropdown];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // 更新筛选条件并触发回调
  const updateFilters = (updates: Partial<typeof filters>) => {
    updateProjectListFilters(updates);
    onFiltersChange?.();
  };

  // 搜索框处理
  const handleSearchChange = (value: string) => {
    updateFilters({ searchTerm: value });
  };

  // 多选筛选器处理
  const handleMultiSelectChange = (
    filterKey: keyof typeof filters,
    value: string,
    currentValues: string[]
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({ [filterKey]: newValues });
  };

  // 日期范围处理
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    updateFilters({
      dateRange: {
        start: start ? start.toISOString().split('T')[0] : '',
        end: end ? end.toISOString().split('T')[0] : '',
      }
    });
  };

  // 渲染多选下拉菜单
  const renderMultiSelectDropdown = (
    key: string,
    label: string,
    options: FilterOption[],
    selectedValues: string[],
    filterKey: keyof typeof filters
  ) => {
    const isOpen = openDropdown === key;
    const selectedCount = selectedValues.length;

    return (
      <div 
        className="relative"
        ref={el => dropdownRefs.current[key] = el}
      >
        <button
          onClick={() => setOpenDropdown(isOpen ? null : key)}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm border rounded-lg
            transition-colors duration-200
            ${selectedCount > 0 
              ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }
            ${compact ? 'px-2 py-1 text-xs' : ''}
          `}
        >
          <span>{label}</span>
          {selectedCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full dark:bg-blue-800 dark:text-blue-100">
              {selectedCount}
            </span>
          )}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleMultiSelectChange(filterKey, option.value, selectedValues)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({option.count})
                    </span>
                  )}
                </label>
              ))}
            </div>
            
            {selectedValues.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                <button
                  onClick={() => updateFilters({ [filterKey]: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  清除选择
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 计算活跃筛选器数量
  const activeFiltersCount = [
    filters.searchTerm,
    filters.selectedStatuses.length > 0,
    filters.selectedPriorities.length > 0,
    filters.selectedOwners.length > 0,
    filters.selectedKrs.length > 0,
    filters.dateRange.start || filters.dateRange.end,
    filters.hasComments,
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜索框和筛选器状态 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜索项目..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-white
              ${compact ? 'px-3 py-1.5 text-sm' : ''}
            `}
          />
          {filters.searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FunnelIcon className="w-4 h-4" />
            <span>{activeFiltersCount} 个筛选条件</span>
          </div>
        )}
      </div>

      {/* 筛选器组 */}
      <div className={`flex flex-wrap gap-3 ${compact ? 'gap-2' : ''}`}>
        {/* 日期范围筛选 */}
        {showDateRange && (
          <EnhancedDateRangePicker
            startDate={filters.dateRange.start ? new Date(filters.dateRange.start) : null}
            endDate={filters.dateRange.end ? new Date(filters.dateRange.end) : null}
            onChange={handleDateRangeChange}
            placeholder="选择日期范围"
            className={compact ? 'text-xs' : ''}
          />
        )}

        {/* 状态筛选 */}
        {showStatusFilter && statusOptions.length > 0 && 
          renderMultiSelectDropdown('status', '状态', statusOptions, filters.selectedStatuses, 'selectedStatuses')
        }

        {/* 优先级筛选 */}
        {showPriorityFilter && priorityOptions.length > 0 && 
          renderMultiSelectDropdown('priority', '优先级', priorityOptions, filters.selectedPriorities, 'selectedPriorities')
        }

        {/* 负责人筛选 */}
        {showOwnerFilter && ownerOptions.length > 0 && 
          renderMultiSelectDropdown('owner', '负责人', ownerOptions, filters.selectedOwners, 'selectedOwners')
        }

        {/* KR筛选 */}
        {showKrFilter && krOptions.length > 0 && 
          renderMultiSelectDropdown('kr', 'KR', krOptions, filters.selectedKrs, 'selectedKrs')
        }

        {/* 评论筛选 */}
        {showCommentsFilter && (
          <button
            onClick={() => updateFilters({ hasComments: !filters.hasComments })}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm border rounded-lg
              transition-colors duration-200
              ${filters.hasComments
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }
              ${compact ? 'px-2 py-1 text-xs' : ''}
            `}
          >
            有评论
          </button>
        )}
      </div>

      {/* 清除所有筛选器 */}
      {activeFiltersCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => updateFilters({
              searchTerm: '',
              selectedStatuses: [],
              selectedPriorities: [],
              selectedOwners: [],
              selectedKrs: [],
              dateRange: { start: '', end: '' },
              hasComments: false,
            })}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            清除所有筛选条件
          </button>
        </div>
      )}
    </div>
  );
};