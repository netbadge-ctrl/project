import React, { useState, useRef, useEffect } from 'react';
import { RichTextInput } from './RichTextInput';

export const RichTextEditableCell = ({ html, onSave }: { html: string, onSave: (value: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentHtml, setCurrentHtml] = useState(html);
    const [originalHtml, setOriginalHtml] = useState(html); // 记录开始编辑时的原始内容
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const [hasUserEdited, setHasUserEdited] = useState(false); // 跟踪用户是否真正编辑过
    const textRef = useRef<HTMLDivElement>(null);

    const maxLines = 5;

    useEffect(() => {
        // 确保currentHtml始终与传入的html保持同步
        if (html !== currentHtml && !isEditing) {
            setCurrentHtml(html);
            setOriginalHtml(html);
            setHasUserEdited(false);
        }
    }, [html, currentHtml, isEditing]);

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

    // 简化的内容比较，只去除首尾空白
    const normalizeHtml = (htmlContent: string) => {
        if (!htmlContent) return '';
        return htmlContent.trim();
    };

    const handleSave = () => {
        // 只有用户真正编辑过内容才进行保存检查
        if (!hasUserEdited) {
            console.log('🔧 User has not edited content, skipping save');
            setIsEditing(false);
            return;
        }

        const normalizedCurrent = normalizeHtml(currentHtml);
        const normalizedOriginal = normalizeHtml(originalHtml);
        const hasChanged = normalizedCurrent !== normalizedOriginal;
        
        console.log('🔧 RichTextEditableCell handleSave called', { 
            currentHtml: currentHtml.substring(0, 50) + '...', 
            originalHtml: originalHtml.substring(0, 50) + '...', 
            normalizedCurrent: normalizedCurrent.substring(0, 50) + '...',
            normalizedOriginal: normalizedOriginal.substring(0, 50) + '...',
            changed: hasChanged,
            hasUserEdited,
            currentLength: currentHtml.length,
            originalLength: originalHtml.length
        });
        
        if (hasChanged) {
            console.log('🔧 Calling onSave with new content');
            onSave(currentHtml);
        } else {
            console.log('🔧 No changes detected, skipping save');
        }
        
        setIsEditing(false);
        setHasUserEdited(false);
    };

    // 延迟失焦保存，避免过于敏感
    const handleBlurWithDelay = () => {
        // 延迟150ms，给用户足够时间在编辑器内移动焦点
        setTimeout(() => {
            // 检查当前是否还在编辑状态，如果不是则不保存
            if (document.activeElement?.closest('.rich-text-input')) {
                return; // 焦点还在富文本编辑器内，不保存
            }
            handleSave();
        }, 150);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        // 如果点击的是展开/收起按钮，不进入编辑模式
        if ((e.target as HTMLElement).closest('.expand-button')) {
            return;
        }
        
        // 进入编辑模式时，记录原始内容并重置编辑状态
        setCurrentHtml(html);
        setOriginalHtml(html);
        setHasUserEdited(false);
        setIsEditing(true);
    };

    const handleChange = (newHtml: string) => {
        setCurrentHtml(newHtml);
        // 标记用户已经编辑过内容
        if (!hasUserEdited) {
            setHasUserEdited(true);
        }
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
            <div className="w-full min-h-[300px]">
                <RichTextInput
                    html={currentHtml}
                    onChange={handleChange}
                    onBlur={handleBlurWithDelay}
                    className="focus:bg-gray-100 dark:focus:bg-[#333] rich-text-editor dynamic-height"
                    minRows={8} // 固定较大的最小行数，确保编辑框足够大
                    maxRows={25} // 增加最大行数
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
                <span className="text-gray-400 dark:text-gray-500">-</span>
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
                    data-wordwrap="true"
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
            
            {/* CSS样式来处理文本换行 */}
            <style>{`
                .rich-text-display {
                    word-wrap: break-word;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    white-space: pre-wrap;
                    max-width: 100%;
                }
                .rich-text-display * {
                    word-wrap: break-word;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    max-width: 100%;
                }
                .rich-text-display b { font-weight: 600; }
                .rich-text-display font[color="#ef4444"] { color: #ef4444; }
                .rich-text-display p { margin-bottom: 0.5rem; }
                .rich-text-display br { display: block; margin: 0.25rem 0; }
                .rich-text-display div { margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
};