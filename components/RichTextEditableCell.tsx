import React, { useState } from 'react';
import { RichTextInput } from './RichTextInput';

export const RichTextEditableCell = ({ html, onSave }: { html: string, onSave: (value: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentHtml, setCurrentHtml] = useState(html);

    const handleSave = () => {
        if (currentHtml !== html) {
            onSave(currentHtml);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div onBlur={handleSave}>
                <RichTextInput
                    html={currentHtml}
                    onChange={setCurrentHtml}
                    className="focus:bg-gray-100 dark:focus:bg-[#333]"
                />
            </div>
        )
    }

    return <div onClick={() => setIsEditing(true)} dangerouslySetInnerHTML={{ __html: html || `<span class="text-gray-400 dark:text-gray-500">N/A</span>`}} className="w-full h-full cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#3a3a3a] transition-colors duration-200 whitespace-pre-wrap"/>;
}