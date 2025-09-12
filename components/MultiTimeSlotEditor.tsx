import React from 'react';
import { TimeSlot } from '../types';
import { EnhancedDateRangePicker } from './EnhancedDateRangePicker';
import { IconPlus, IconTrash } from './Icons';

interface MultiTimeSlotEditorProps {
  timeSlots: TimeSlot[];
  onChange: (timeSlots: TimeSlot[]) => void;
  label?: string;
  hideLabel?: boolean;
}

export const MultiTimeSlotEditor: React.FC<MultiTimeSlotEditorProps> = ({
  timeSlots,
  onChange,
  label = "排期",
  hideLabel = false
}) => {
  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startDate: '',
      endDate: '',
      description: ''
    };
    onChange([...timeSlots, newSlot]);
  };

  const handleRemoveTimeSlot = (slotId: string) => {
    onChange(timeSlots.filter(slot => slot.id !== slotId));
  };

  const handleDateRangeChange = (slotId: string, startDate: string, endDate: string) => {
    onChange(timeSlots.map(slot => 
      slot.id === slotId ? { ...slot, startDate, endDate } : slot
    ));
  };

  return (
    <div className="space-y-3">
      {!hideLabel && (
        <label className="text-sm text-gray-500 dark:text-gray-400 block">
          {label}
        </label>
      )}
      
      {/* 时段列表 */}
      <div className="space-y-2">
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-3 bg-gray-50 dark:bg-[#2a2a2a] p-3 rounded-md">
            <div className="flex-1">
              <EnhancedDateRangePicker
                startDate={slot.startDate}
                endDate={slot.endDate}
                onSelectRange={(start, end) => handleDateRangeChange(slot.id, start, end)}
                label=""
                placeholder="选择日期范围"
                compact={true}
              />
            </div>
            <button
              onClick={() => handleRemoveTimeSlot(slot.id)}
              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
              title="删除时段"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 添加时段按钮 */}
      <button
        onClick={handleAddTimeSlot}
        className="w-full flex items-center justify-center gap-2 py-2 text-[#6C63FF] hover:text-[#5a52d9] hover:bg-[#6C63FF]/5 rounded-md transition-colors text-sm font-medium"
      >
        <IconPlus className="w-4 h-4" />
        添加时段
      </button>
    </div>
  );
};