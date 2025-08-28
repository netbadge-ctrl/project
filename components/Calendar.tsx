import React from 'react';
import { IconChevronLeft, IconChevronRight } from './Icons';

interface CalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
  hoverDate?: Date;
  onHoverDate?: (date: Date | null) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  setCurrentDate,
  selectedDate,
  onSelectDate,
  startDate,
  endDate,
  hoverDate,
  onHoverDate,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 });

  const isSameDay = (d1?: Date, d2?: Date) => {
    return d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const isToday = (day: number) => {
      const today = new Date();
      return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isInRange = (day: number) => {
    if (!startDate) return false;
    const currentDay = new Date(year, month, day);
    if (endDate) return currentDay > startDate && currentDay < endDate;
    if (hoverDate) return currentDay > startDate && currentDay < hoverDate || currentDay < startDate && currentDay > hoverDate;
    return false;
  };

  const getDayClass = (day: number) => {
    const d = new Date(year, month, day);
    let classes = 'w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors duration-150';

    const isSelected = isSameDay(d, selectedDate);
    const isStart = isSameDay(d, startDate);
    const isEnd = isSameDay(d, endDate);
    const isHover = isSameDay(d, hoverDate);
    
    if (isStart || isEnd || isSelected) {
      classes += ' bg-[#6C63FF] text-white';
    } else if (isInRange(day)) {
      classes += ' bg-[#6c63ff]/20 dark:bg-[#6c63ff]/30 text-gray-900 dark:text-white rounded-none';
    } else if (onSelectDate) {
        classes += ' hover:bg-gray-200 dark:hover:bg-[#3a3a3a] cursor-pointer';
    }

    if(isToday(day) && !isSelected && !isStart && !isEnd) {
        classes += ' border border-[#6C63FF]';
    }

    return classes;
  };

  return (
    <div className="bg-white dark:bg-[#2d2d2d] p-4 rounded-lg w-72 text-gray-800 dark:text-gray-300">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"><IconChevronLeft className="w-5 h-5"/></button>
        <div className="font-semibold text-gray-900 dark:text-white">{`${year}年 ${month + 1}月`}</div>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"><IconChevronRight className="w-5 h-5"/></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        {['一', '二', '三', '四', '五', '六', '日'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => (
          <div
            key={day}
            className={getDayClass(day)}
            onClick={() => onSelectDate && onSelectDate(new Date(year, month, day))}
            onMouseEnter={() => onHoverDate && onHoverDate(new Date(year, month, day))}
            onMouseLeave={() => onHoverDate && onHoverDate(null)}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};