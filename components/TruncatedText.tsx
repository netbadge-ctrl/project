import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  showTooltip?: boolean;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLines = 5,
  className = '',
  showTooltip = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current || !text) return;

      // 重置状态
      textRef.current.style.webkitLineClamp = 'unset';
      textRef.current.style.overflow = 'visible';
      
      const fullHeight = textRef.current.scrollHeight;
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight) || 24;
      const maxHeight = lineHeight * maxLines;
      
      setNeedsTruncation(fullHeight > maxHeight);
    };

    // 延迟检查，确保DOM已渲染
    const timer = setTimeout(checkTruncation, 10);
    return () => clearTimeout(timer);
  }, [text, maxLines]);

  if (!text) {
    return <span className="text-gray-400 dark:text-gray-500">-</span>;
  }

  const displayStyle = needsTruncation && !isExpanded ? {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    lineHeight: '1.5'
  } : {
    lineHeight: '1.5'
  };

  return (
    <div className={`${className} relative`}>
      <div
        ref={textRef}
        style={displayStyle}
        className="whitespace-pre-wrap break-words"
        title={showTooltip && needsTruncation && !isExpanded ? text : undefined}
      >
        {text}
      </div>
      
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {isExpanded ? '收起' : '展示全部'}
        </button>
      )}
    </div>
  );
};