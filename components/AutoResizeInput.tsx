import React, { useRef, useEffect, useCallback, useMemo } from 'react';

interface AutoResizeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  onSave?: () => void;
  onCancel?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export const AutoResizeInput: React.FC<AutoResizeInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  minRows = 1,
  maxRows = 5,
  onSave,
  onCancel,
  onBlur,
  onKeyDown,
  autoFocus = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeightTimerRef = useRef<NodeJS.Timeout | null>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 使用requestAnimationFrame优化性能
    requestAnimationFrame(() => {
      // 重置高度以获取正确的scrollHeight
      textarea.style.height = 'auto';
      
      // 获取样式信息
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 21;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
      
      const totalPadding = paddingTop + paddingBottom + borderTop + borderBottom;
      const contentHeight = textarea.scrollHeight;
      
      // 计算最小和最大高度
      const minHeight = lineHeight * minRows + totalPadding;
      const maxHeight = lineHeight * maxRows + totalPadding;
      
      // 计算最终高度
      let finalHeight = Math.max(minHeight, contentHeight);
      if (maxHeight > 0) {
        finalHeight = Math.min(finalHeight, maxHeight);
      }
      
      // 设置高度和滚动
      textarea.style.height = `${finalHeight}px`;
      textarea.style.overflowY = finalHeight >= maxHeight ? 'auto' : 'hidden';
    });
  }, [minRows, maxRows]);

  // 监听value变化，立即调整高度
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // 组件挂载后调整高度
  useEffect(() => {
    const timer = setTimeout(adjustHeight, 0);
    return () => clearTimeout(timer);
  }, [adjustHeight]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (adjustHeightTimerRef.current) {
        clearTimeout(adjustHeightTimerRef.current);
      }
    };
  }, []);

  // 防抖的高度调整函数
  // 直接调用 adjustHeight，移除防抖以提高响应速度
  const debouncedAdjustHeight = useCallback(() => {
    adjustHeight();
  }, [adjustHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 对于项目名称，Enter键保存而不是换行
      e.preventDefault();
      onSave?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
    
    // 调用外部的onKeyDown处理器
    onKeyDown?.(e);
    
    // 按键后使用防抖的高度调整
    debouncedAdjustHeight();
  }, [onSave, onCancel, onKeyDown, debouncedAdjustHeight]);

  const handleBlur = useCallback(() => {
    onBlur?.();
    onSave?.();
  }, [onBlur, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 使用防抖的高度调整
    debouncedAdjustHeight();
  }, [onChange, debouncedAdjustHeight]);

  const handleInput = useCallback(() => {
    // 输入事件也使用防抖的高度调整
    debouncedAdjustHeight();
  }, [debouncedAdjustHeight]);

  const textareaStyle = useMemo(() => ({
    minHeight: `${minRows * 1.5}rem`,
    overflow: 'hidden' as const,
    resize: 'none' as const
  }), [minRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={minRows}
      className={`resize-none auto-resize-input ${className}`}
      style={textareaStyle}
      autoFocus={autoFocus}
    />
  );
};