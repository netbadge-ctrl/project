import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  onSave?: () => void;
  onCancel?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  minRows = 1,
  maxRows = 10,
  onSave,
  onCancel,
  onKeyDown,
  onBlur,
  autoFocus = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(minRows);
  const adjustHeightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string>(value);

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
      
      // 更新rows状态（用于显示）
      const calculatedRows = Math.max(minRows, Math.min(maxRows, Math.ceil((finalHeight - totalPadding) / lineHeight)));
      setRows(calculatedRows);
    });
  }, [minRows, maxRows]);

  // 监听value变化，立即调整高度
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    // 组件挂载后调整高度
    const timer = setTimeout(adjustHeight, 0);
    return () => clearTimeout(timer);
  }, [adjustHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
    // 调用外部的onKeyDown处理器
    onKeyDown?.(e);
  }, [onSave, onCancel, onKeyDown]);

  const handleBlur = useCallback(() => {
    onBlur?.();
    onSave?.();
  }, [onBlur, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 输入时立即调整高度，使用requestAnimationFrame确保在下一帧执行
    requestAnimationFrame(() => adjustHeight());
  }, [onChange, adjustHeight]);

  const handleInput = useCallback(() => {
    // 输入事件也触发高度调整，立即执行
    requestAnimationFrame(() => adjustHeight());
  }, [adjustHeight]);

  const textareaStyle = useMemo(() => ({
    minHeight: `${minRows * 1.5}rem`,
    overflow: 'hidden' as const
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
      rows={rows}
      className={`resize-none auto-resize-textarea ${className}`}
      style={textareaStyle}
      autoFocus={autoFocus}
    />
  );
};