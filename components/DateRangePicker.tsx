import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from './Calendar';
import { IconCalendar } from './Icons';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onSelectRange: (startDate: string, endDate: string) => void;
  placeholder?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onSelectRange,
  placeholder = '选择日期范围',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  const calendarStyle = useDropdownPosition({
      triggerRef: buttonRef,
      menuRef: calendarContainerRef,
      isOpen,
  });
  
  const [calendarDate, setCalendarDate] = useState(startDate ? new Date(startDate) : new Date());

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
              setIsOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);

      if (!isOpen) {
          setSelectionStart(null);
          setHoverDate(null);
      }

      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [isOpen]);


  const handleDateSelect = (date: Date) => {
      if (!selectionStart) {
          setSelectionStart(date);
          setHoverDate(null);
      } else {
          const firstDate = selectionStart;
          const secondDate = date;

          const newStartDate = firstDate < secondDate ? firstDate : secondDate;
          const newEndDate = firstDate < secondDate ? secondDate : firstDate;

          onSelectRange(
              newStartDate.toISOString().split('T')[0],
              newEndDate.toISOString().split('T')[0]
          );
          
          setIsOpen(false);
      }
  };

  const displayValue = startDate && endDate ? `${startDate} → ${endDate}` : placeholder;

  const displayedStartDate = selectionStart || (startDate ? new Date(startDate) : undefined);
  const displayedEndDate = selectionStart ? undefined : (endDate ? new Date(endDate) : undefined);
  const displayedHoverDate = selectionStart ? hoverDate || undefined : undefined;

  return (
    <div className="relative" ref={pickerRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-200 dark:bg-[#3a3a3a] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-3 py-1.5 w-full text-sm text-left text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] flex items-center justify-between"
      >
        <span className={!startDate && !endDate ? 'text-gray-400 dark:text-gray-500' : ''}>{displayValue}</span>
        <IconCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
      {isOpen && (
        <div ref={calendarContainerRef} style={calendarStyle}>
          <Calendar
            currentDate={calendarDate}
            setCurrentDate={setCalendarDate}
            onSelectDate={handleDateSelect}
            startDate={displayedStartDate}
            endDate={displayedEndDate}
            hoverDate={displayedHoverDate}
            onHoverDate={setHoverDate}
          />
        </div>
      )}
    </div>
  );
};