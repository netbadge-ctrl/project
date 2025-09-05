import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from './Calendar';
import { IconCalendar, IconX } from './Icons';

interface EnhancedDateRangePickerProps {
  startDate: string;
  endDate: string;
  onSelectRange: (startDate: string, endDate: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
}

export const EnhancedDateRangePicker: React.FC<EnhancedDateRangePickerProps> = ({
  startDate,
  endDate,
  onSelectRange,
  label = '选择日期范围',
  placeholder = '点击选择日期范围',
  minDate,
  maxDate,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 将字符串日期转换为Date对象
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // 将Date对象转换为YYYY-MM-DD格式字符串（避免时区问题）
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化显示日期
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 初始化临时日期
  useEffect(() => {
    setTempStartDate(parseDate(startDate));
    setTempEndDate(parseDate(endDate));
  }, [startDate, endDate]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // 重置临时选择
        setTempStartDate(parseDate(startDate));
        setTempEndDate(parseDate(endDate));
        setSelectionMode('start');
        setHoverDate(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, startDate, endDate]);

  // 处理日期选择
  const handleDateSelect = (selectedDate: Date) => {
    if (disabled) return;

    if (selectionMode === 'start' || !tempStartDate) {
      // 选择开始日期
      setTempStartDate(selectedDate);
      setTempEndDate(null);
      setSelectionMode('end');
      setHoverDate(null);
    } else {
      // 选择结束日期
      let newStartDate = tempStartDate;
      let newEndDate = selectedDate;

      // 确保开始日期早于结束日期
      if (selectedDate < tempStartDate) {
        newStartDate = selectedDate;
        newEndDate = tempStartDate;
      }

      setTempStartDate(newStartDate);
      setTempEndDate(newEndDate);
      
      // 应用选择
      onSelectRange(formatDate(newStartDate), formatDate(newEndDate));
      setIsOpen(false);
      setSelectionMode('start');
      setHoverDate(null);
    }
  };

  // 处理鼠标悬停
  const handleDateHover = (hoveredDate: Date | null) => {
    if (selectionMode === 'end' && tempStartDate && hoveredDate) {
      setHoverDate(hoveredDate);
    } else {
      setHoverDate(null);
    }
  };

  // 清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectionMode('start');
    setHoverDate(null);
    onSelectRange('', '');
  };

  // 获取显示文本
  const getDisplayText = (): string => {
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    } else if (startDate) {
      return formatDisplayDate(startDate);
    }
    return placeholder;
  };



  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      {/* 输入框 */}
      <div
        className={`
          relative w-full px-3 py-2 text-sm border rounded-lg cursor-pointer transition-all
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700' 
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]'
          }
          ${isOpen ? 'ring-2 ring-[#6C63FF] border-[#6C63FF]' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconCalendar className="w-4 h-4 text-gray-400" />
            <span className={startDate && endDate ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {getDisplayText()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">

            {(startDate || endDate) && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <IconX className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 下拉日历 */}
      {isOpen && !disabled && (
        <div className="fixed z-[9999] bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[320px]" 
             style={{
               top: (() => {
                 if (!dropdownRef.current) return '50%';
                 const rect = dropdownRef.current.getBoundingClientRect();
                 const dropdownHeight = 400; // 预估下拉菜单高度
                 const viewportHeight = window.innerHeight;
                 const spaceBelow = viewportHeight - rect.bottom;
                 const spaceAbove = rect.top;
                 
                 // 如果下方空间足够，向下展开
                 if (spaceBelow >= dropdownHeight) {
                   return `${rect.bottom + 8}px`;
                 }
                 // 如果上方空间足够，向上展开
                 else if (spaceAbove >= dropdownHeight) {
                   return `${rect.top - dropdownHeight - 8}px`;
                 }
                 // 否则居中显示
                 else {
                   return `${Math.max(20, (viewportHeight - dropdownHeight) / 2)}px`;
                 }
               })(),
               left: (() => {
                 if (!dropdownRef.current) return '50%';
                 const rect = dropdownRef.current.getBoundingClientRect();
                 const dropdownWidth = 320;
                 const viewportWidth = window.innerWidth;
                 
                 // 确保不超出视口右边界
                 if (rect.left + dropdownWidth > viewportWidth) {
                   return `${Math.max(20, viewportWidth - dropdownWidth - 20)}px`;
                 }
                 return `${rect.left}px`;
               })()
             }}>
          <div className="p-4">
            {/* 选择提示 */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectionMode === 'start' ? (
                <span>请选择开始日期</span>
              ) : (
                <span>请选择结束日期（或拖动选择范围）</span>
              )}
            </div>



            {/* 日历组件 */}
            <Calendar
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              startDate={tempStartDate}
              endDate={tempEndDate}
              hoverDate={hoverDate}
              onSelectDate={handleDateSelect}
              onHoverDate={handleDateHover}
            />


          </div>
        </div>
      )}
    </div>
  );
};