import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { IconChevronDown, IconSearch } from './Icons';
import { fuzzySearch } from '../utils';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

interface Option {
    value: string;
    label: string;
}

interface SearchableSingleSelectDropdownProps {
    options: Option[];
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
}

export const SearchableSingleSelectDropdown: React.FC<SearchableSingleSelectDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const menuStyle = useDropdownPosition({ triggerRef, menuRef, isOpen });
    
    const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options
            .filter(option => fuzzySearch(searchTerm, option.label))
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
    }, [options, searchTerm]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const menuContent = (
        <div ref={menuRef} style={menuStyle} className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-[#4a4a4a]">
                <div className="relative">
                   <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                   <input
                     ref={searchInputRef}
                     type="text"
                     placeholder="搜索..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="bg-gray-50 dark:bg-[#232323] border border-gray-300 dark:border-[#4a4a4a] rounded-md pl-8 pr-2 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                   />
                </div>
            </div>
            <ul className="p-1 flex-grow overflow-y-auto max-h-56">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                        <li key={option.value}>
                            <button
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3a3a3a] ${value === option.value ? 'font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-[#3a3a3a]' : 'text-gray-800 dark:text-gray-200'}`}
                            >
                                {option.label}
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="px-3 py-2 text-sm text-gray-500 text-center">无匹配项</li>
                )}
            </ul>
        </div>
    );

    const portalElement = typeof document !== 'undefined' ? document.body : null;
    if (!portalElement) return null;

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(p => !p)}
                className="bg-gray-100 dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-3 py-1.5 w-full text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] flex items-center justify-between text-left"
            >
                <span className={!selectedOption ? 'text-gray-400 dark:text-gray-500' : ''}>
                    {selectedOption?.label || placeholder}
                </span>
                <IconChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {ReactDOM.createPortal(menuContent, portalElement)}
        </>
    );
};