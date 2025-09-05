import React, { useState, useEffect } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange?: (startDate: string, endDate: string) => void;
  onSelectRange?: (startDate: string, endDate: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  showValidation?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  onSelectRange,
  label = '项目排期',
  minDate,
  maxDate,
  className = '',
  showValidation = true
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  const validateDateRange = (start: string, end: string): string => {
    if (!start || !end) return '';
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    if (startDateObj > endDateObj) {
      return '开始日期不能晚于结束日期';
    }
    
    if (minDate && startDateObj < new Date(minDate)) {
      return `开始日期不能早于 ${minDate}`;
    }
    
    if (maxDate && endDateObj > new Date(maxDate)) {
      return `结束日期不能晚于 ${maxDate}`;
    }
    
    // 检查是否为周末（可选的业务规则）
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6;
    };
    
    if (isWeekend(startDateObj) || isWeekend(endDateObj)) {
      return '建议避免在周末开始或结束项目';
    }
    
    return '';
  };

  const handleStartDateChange = (newStartDate: string) => {
    setLocalStartDate(newStartDate);
    
    // 如果开始日期晚于结束日期，自动调整结束日期
    if (newStartDate && localEndDate && new Date(newStartDate) > new Date(localEndDate)) {
      const adjustedEndDate = new Date(newStartDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 2); // 默认项目持续3天
      const adjustedEndDateStr = `${adjustedEndDate.getFullYear()}-${String(adjustedEndDate.getMonth() + 1).padStart(2, '0')}-${String(adjustedEndDate.getDate()).padStart(2, '0')}`;
      setLocalEndDate(adjustedEndDateStr);
      
      const error = validateDateRange(newStartDate, adjustedEndDateStr);
      setValidationError(error);
      
      if (!error) {
        const callback = onSelectRange || onDateChange;
        callback && callback(newStartDate, adjustedEndDateStr);
      }
    } else {
      const error = validateDateRange(newStartDate, localEndDate);
      setValidationError(error);
      
      if (!error) {
        const callback = onSelectRange || onDateChange;
        callback && callback(newStartDate, localEndDate);
      }
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setLocalEndDate(newEndDate);
    
    const error = validateDateRange(localStartDate, newEndDate);
    setValidationError(error);
    
    if (!error) {
      const callback = onSelectRange || onDateChange;
      callback && callback(localStartDate, newEndDate);
    }
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getDuration = (): string => {
    if (!localStartDate || !localEndDate) return '';
    
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `共 ${diffDays} 天`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            开始日期
          </label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {localStartDate && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDateForDisplay(localStartDate)}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            结束日期
          </label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={localStartDate || minDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {localEndDate && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDateForDisplay(localEndDate)}
            </p>
          )}
        </div>
      </div>
      
      {/* 项目持续时间显示 */}
      {localStartDate && localEndDate && !validationError && (
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{getDuration()}</span>
        </div>
      )}
      
      {/* 验证错误显示 */}
      {showValidation && validationError && (
        <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}
      
      {/* 快速选择按钮 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const dayAfter = new Date(today);
            dayAfter.setDate(today.getDate() + 3);
            
            const startStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
            const endStr = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`;
            
            const callback = onSelectRange || onDateChange;
            if (callback) {
              callback(startStr, endStr);
              setLocalStartDate(startStr);
              setLocalEndDate(endStr);
            }
          }}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          明天开始(3天)
        </button>
        
        <button
          type="button"
          onClick={() => {
            const monday = new Date();
            const day = monday.getDay();
            const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
            monday.setDate(diff);
            
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);
            
            const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
            const endStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
            
            const callback = onSelectRange || onDateChange;
            if (callback) {
              callback(startStr, endStr);
              setLocalStartDate(startStr);
              setLocalEndDate(endStr);
            }
          }}
          className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
        >
          本周工作日
        </button>
      </div>
    </div>
  );
};