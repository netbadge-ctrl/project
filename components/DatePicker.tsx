import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from './Calendar';
import { IconCalendar } from './Icons';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { formatDateOnly } from '../utils';

interface DatePickerProps {
  selectedDate?: string;
  onSelectDate: (dateString: string) => void;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate, placeholder = '选择日期' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  const calendarStyle = useDropdownPosition({
    triggerRef: buttonRef,
    menuRef: calendarContainerRef,
    isOpen,
  });


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
      onSelectDate(date.toISOString().split('T')[0]);
      setIsOpen(false);
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
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