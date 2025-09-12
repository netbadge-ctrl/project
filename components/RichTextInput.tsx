import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RichTextInputProps {
    html: string;
    onChange: (newHtml: string) => void;
    placeholder?: string;
    className?: string;
    minRows?: number;
    maxRows?: number;
}

export const RichTextInput: React.FC<RichTextInputProps> = ({ 
    html, 
    onChange, 
    placeholder, 
    className = '', 
    minRows = 3,
    maxRows = 15 
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isBoldActive, setIsBoldActive] = useState(false);
    const [isRedActive, setIsRedActive] = useState(false);
    const isInitializedRef = useRef(false);

    // 自动调整高度
    const adjustHeight = useCallback(() => {
        if (!contentRef.current) return;

        const element = contentRef.current;
        const lineHeight = 21; // 固定行高
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;

        // 重置高度以获取真实的scrollHeight
        element.style.height = 'auto';
        const scrollHeight = element.scrollHeight;
        
        // 设置最终高度
        const finalHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        element.style.height = `${finalHeight}px`;
        element.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [minRows, maxRows]);

    // 初始化内容
    useEffect(() => {
        if (contentRef.current && !isInitializedRef.current) {
            contentRef.current.innerHTML = html || '';
            isInitializedRef.current = true;
            adjustHeight();
        }
    }, [html, adjustHeight]);

    // 更新按钮状态
    const updateButtonStates = useCallback(() => {
        if (!contentRef.current) return;
        
        try {
            const boldState = document.queryCommandState('bold');
            const currentColor = document.queryCommandValue('foreColor');
            const redState = currentColor === 'rgb(239, 68, 68)' || currentColor === '#ef4444' || currentColor === 'red';
            
            setIsBoldActive(boldState);
            setIsRedActive(redState);
        } catch (e) {
            // 忽略错误
        }
    }, []);

    // 直接处理输入，移除防抖以提高响应速度
    const handleInput = useCallback(() => {
        if (!contentRef.current) return;
        
        const newHtml = contentRef.current.innerHTML;
        adjustHeight();
        onChange(newHtml);
        updateButtonStates();
    }, [onChange, adjustHeight, updateButtonStates]);

    // 处理按键
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // 允许换行
            setTimeout(() => adjustHeight(), 0);
        }
    }, [adjustHeight]);

    // 处理命令
    const handleCommand = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        
        if (!contentRef.current) return;
        
        contentRef.current.focus();
        
        if (command === 'bold') {
            document.execCommand('bold', false);
        } else if (command === 'foreColor') {
            const currentColor = document.queryCommandValue('foreColor');
            const isCurrentlyRed = currentColor === 'rgb(239, 68, 68)' || currentColor === '#ef4444' || currentColor === 'red';
            
            if (isCurrentlyRed) {
                // 取消标红
                document.execCommand('foreColor', false, '#000000');
            } else {
                // 标红
                document.execCommand('foreColor', false, '#ef4444');
            }
        }
        
        // 更新按钮状态
        setTimeout(() => {
            updateButtonStates();
            handleInput();
        }, 0);
    };

    // 处理焦点
    const handleFocus = useCallback(() => {
        updateButtonStates();
    }, [updateButtonStates]);

    // 处理选择变化
    useEffect(() => {
        const handleSelectionChange = () => {
            if (document.activeElement === contentRef.current) {
                updateButtonStates();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [updateButtonStates]);

    return (
        <div className="rich-text-input">
            {/* 工具栏 */}
            <div className="flex gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <button
                    type="button"
                    onMouseDown={(e) => handleCommand(e, 'bold')}
                    className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                        isBoldActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    B
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => handleCommand(e, 'foreColor')}
                    className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                        isRedActive 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    A
                </button>
            </div>

            {/* 编辑区域 */}
            <div
                ref={contentRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                className={`
                    w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    resize-none overflow-hidden
                    ${className}
                `}
                style={{
                    minHeight: `${21 * minRows}px`,
                    lineHeight: '21px'
                }}
                data-placeholder={placeholder}
            />

            <style>{`
                .rich-text-input [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                .rich-text-input [contenteditable]:focus:before {
                    display: none;
                }
            `}</style>
        </div>
    );
};