import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from './Calendar';
import { IconCalendar } from './Icons';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { formatDateOnly } from '../utils';

interface DatePickerProps {
  selectedDate?: string;
  onSelectDate: (dateString: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate, placeholder = '选择日期', align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // 使用 useDropdownPosition hook 来计算位置
  const menuStyle = useDropdownPosition({ 
    triggerRef: buttonRef, 
    menuRef: calendarContainerRef, 
    isOpen,
    align: align === 'right' ? 'end' : 'start'
  });

  const handleToggleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${year}-${month}-${day}`);
      setIsOpen(false);
  }

  // 日历弹窗内容
  const calendarContent = isOpen ? (
    <div 
      ref={calendarContainerRef} 
      style={menuStyle}
      className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl"
    >
      <Calendar 
        currentDate={calendarDate}
        setCurrentDate={setCalendarDate}
        selectedDate={selectedDate ? new Date(selectedDate) : undefined}
        onSelectDate={handleDateSelect}
      />
    </div>
  ) : null;

  return (
    <div className="relative" ref={pickerRef} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleToggleCalendar}
        className="bg-gray-100 dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-3 py-1.5 w-full text-sm text-left text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] flex items-center justify-between"
      >
        <span className={!selectedDate ? 'text-gray-400 dark:text-gray-500' : ''}>{selectedDate ? formatDateOnly(selectedDate) : placeholder}</span>
        <IconCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
      </button>
      {/* 使用 Portal 渲染到 document.body，避免 z-index 冲突 */}
      {calendarContent && ReactDOM.createPortal(calendarContent, document.body)}
    </div>
  );
};