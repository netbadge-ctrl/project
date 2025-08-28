import React, { useRef, useEffect } from 'react';

interface RichTextInputProps {
    html: string;
    onChange: (newHtml: string) => void;
    placeholder?: string;
    className?: string;
}

export const RichTextInput: React.FC<RichTextInputProps> = ({ html, onChange, placeholder, className = '' }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // This effect correctly syncs the external 'html' prop with the
    // contentEditable div's content. It avoids re-writing the content
    // (and thus losing cursor position) if the change came from user input
    // within this component, because in that case 'html' will already equal
    // the div's innerHTML. This is the key to fixing the input issue.
    useEffect(() => {
        if (contentRef.current && html !== contentRef.current.innerHTML) {
            contentRef.current.innerHTML = html;
        }
    }, [html]);

    const handleCommand = (e: React.MouseEvent, command: string, value: string | null = null) => {
        e.preventDefault();
        document.execCommand(command, false, value);
        contentRef.current?.focus();
        // After executing a command, the content changes, so we should trigger onChange.
        handleInput();
    };

    const handleInput = () => {
        if (contentRef.current) {
            const newHtml = contentRef.current.innerHTML;
            onChange(newHtml);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 统一换行操作：Enter保存，Shift+Enter换行
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter允许换行
                return;
            } else {
                // Enter键保存（但富文本编辑器通常不需要保存操作，所以这里允许换行）
                return;
            }
        }
    };

    const buttonStyle = "px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#4a4a4a] rounded-md transition-colors";

    return (
        <div className="relative">
            <div className="bg-gray-100 dark:bg-[#3a3a3a] rounded-t-md border-b border-gray-300 dark:border-[#4a4a4a] p-1 flex items-center gap-1">
                <button onMouseDown={(e) => handleCommand(e, 'bold')} className={buttonStyle} aria-label="加粗">加粗</button>
                <button onMouseDown={(e) => handleCommand(e, 'foreColor', '#ef4444')} className={`${buttonStyle} text-red-500`} aria-label="标红">标红</button>
            </div>
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                // We DO NOT use dangerouslySetInnerHTML here. 'useEffect' manages the content.
                // This prevents React from overwriting the DOM on every state change.
                className={`bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] border-t-0 rounded-b-md px-2 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] whitespace-pre-wrap resize-y relative ${className}`}
                data-placeholder={placeholder}
            />
             <style>{`
                [contenteditable][data-placeholder]:empty:before{
                    content: attr(data-placeholder);
                    color: #9ca3af; /* text-gray-400 */
                    position: absolute;
                    left: 0.5rem; /* Corresponds to px-2 */
                    top: 0.375rem; /* Corresponds to py-1.5 */
                    pointer-events: none;
                }
                 .dark [contenteditable][data-placeholder]:empty:before{
                    color: #6b7280; /* text-gray-500 */
                 }
            `}</style>
        </div>
    );
};