import React, { useState, useRef, useEffect } from 'react';
import { RichTextInput } from './RichTextInput';

export const RichTextEditableCell = ({ html, onSave }: { html: string, onSave: (value: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentHtml, setCurrentHtml] = useState(html);
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    const maxLines = 5;

    useEffect(() => {
        // 确保currentHtml始终与传入的html保持同步
        if (html !== currentHtml) {
            setCurrentHtml(html);
        }
    }, [html, currentHtml]);

    useEffect(() => {
        const checkTruncation = () => {
            if (!textRef.current || !html) {
                setNeedsTruncation(false);
                return;
            }

            // 创建临时元素来测量内容高度
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.cssText = `
                position: absolute;
                visibility: hidden;
                width: ${textRef.current.offsetWidth || 300}px;
                font-size: 14px;
                line-height: 1.5;
                padding: 0;
                word-wrap: break-word;
                white-space: pre-wrap;
                font-family: inherit;
            `;
            document.body.appendChild(tempDiv);
            
            const lineHeight = parseFloat(getComputedStyle(tempDiv).lineHeight) || 21;
            const maxHeight = lineHeight * maxLines;
            const actualHeight = tempDiv.scrollHeight;
            
            document.body.removeChild(tempDiv);
            
            setNeedsTruncation(actualHeight > maxHeight);
        };

        // 延迟检查，确保DOM已渲染
        const timer = setTimeout(checkTruncation, 10);
        return () => clearTimeout(timer);
    }, [html, maxLines]);

    const handleSave = () => {
        if (currentHtml !== html) {
            onSave(currentHtml);
        }
        setIsEditing(false);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        // 如果点击的是展开/收起按钮，不进入编辑模式
        if ((e.target as HTMLElement).closest('.expand-button')) {
            return;
        }
        
        // 进入编辑模式前，确保currentHtml是最新的
        if (currentHtml !== html) {
            setCurrentHtml(html);
        }
        
        setIsEditing(true);
    };

    const handleChange = (newHtml: string) => {
        setCurrentHtml(newHtml);
    };

    // 计算内容的行数来设置合适的初始高度
    const getContentLines = (content: string) => {
        if (!content) return 3;
        
        // 创建临时元素来测量内容高度
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: 300px;
            font-size: 14px;
            line-height: 1.5;
            padding: 6px 8px;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-family: inherit;
        `;
        document.body.appendChild(tempDiv);
        
        const lineHeight = 21; // 14px * 1.5
        const lines = Math.ceil(tempDiv.scrollHeight / lineHeight);
        document.body.removeChild(tempDiv);
        
        return Math.max(3, Math.min(15, lines));
    };

    if (isEditing) {
        const contentLines = getContentLines(currentHtml);
        const minRows = Math.max(3, contentLines);
        const maxRows = 15;

        return (
            <div onBlur={handleSave} className="w-full">
                <RichTextInput
                    html={currentHtml}
                    onChange={handleChange}
                    className="focus:bg-gray-100 dark:focus:bg-[#333] rich-text-editor dynamic-height"
                    minRows={minRows}
                    maxRows={maxRows}
                />
            </div>
        );
    }

    if (!html) {
        return (
            <div 
                onClick={handleEditClick}
                className="w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 flex items-center"
            >
                <span className="text-gray-400 dark:text-gray-500">N/A</span>
            </div>
        );
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
        <div className="w-full h-full relative">
            <div 
                onClick={handleEditClick}
                className="w-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200"
            >
                <div
                    ref={textRef}
                    style={displayStyle}
                    className="whitespace-pre-wrap table-cell-content w-full text-sm leading-relaxed rich-text-display break-words"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                
                {needsTruncation && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="expand-button mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        {isExpanded ? '收起' : '展示全部'}
                    </button>
                )}
            </div>
        </div>
    );
};