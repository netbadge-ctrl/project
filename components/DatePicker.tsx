import React, { useState, useRef, useEffect } from 'react';
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
  const [showAbove, setShowAbove] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // 智能定位逻辑，检测空间并决定向上还是向下展示
  const calculatePosition = () => {
    if (!buttonRef.current) return false;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const calendarHeight = 320; // 日历组件的大概高度
    
    // 检查下方空间是否足够
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // 如果下方空间不足且上方空间更充足，则向上展示
    return spaceBelow < calendarHeight && spaceAbove > spaceBelow;
  };

  const handleToggleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isOpen) {
      // 在打开之前先计算位置，避免闪烁
      const shouldShowAbove = calculatePosition();
      setShowAbove(shouldShowAbove);
    }
    
    setIsOpen(!isOpen);
  };

  const calendarStyle: React.CSSProperties = isOpen ? {
    position: 'absolute',
    ...(showAbove ? { bottom: '100%', marginBottom: '2px' } : { top: '100%', marginTop: '2px' }),
    ...(align === 'right' ? { right: '0' } : { left: '0' }),
    zIndex: 9999
  } : { display: 'none' };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateSelect = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${year}-${month}-${day}`);
      setIsOpen(false);
  }

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
      {isOpen && (
        <div ref={calendarContainerRef} style={calendarStyle}>
          <Calendar 
            currentDate={calendarDate}
            setCurrentDate={setCalendarDate}
            selectedDate={selectedDate ? new Date(selectedDate) : undefined}
            onSelectDate={handleDateSelect}
          />
        </div>
      )}
    </div>
  );
};