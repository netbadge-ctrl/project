import { useState, useLayoutEffect, RefObject } from 'react';

interface DropdownPositionOptions {
    triggerRef: RefObject<HTMLElement>;
    menuRef: RefObject<HTMLElement>;
    isOpen: boolean;
    gap?: number;
    align?: 'start' | 'end';
    preferredPosition?: 'bottom' | 'top';
}

export const useDropdownPosition = ({
    triggerRef,
    menuRef,
    isOpen,
    gap = 4,
    align = 'start',
    preferredPosition = 'bottom'
}: DropdownPositionOptions) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        opacity: 0,
        pointerEvents: 'none',
    });

    useLayoutEffect(() => {
        if (!isOpen) {
            setStyle(s => ({ ...s, opacity: 0, pointerEvents: 'none' }));
            return;
        }
        
        const triggerEl = triggerRef.current;
        const menuEl = menuRef.current;
        if (!triggerEl || !menuEl) return;
        
        const calculatePosition = () => {
            const rect = triggerEl.getBoundingClientRect();
            const menuHeight = menuEl.offsetHeight;
            const menuWidth = menuEl.offsetWidth;
            
            let top: number, left: number;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const openUp = (preferredPosition === 'top' && spaceAbove > menuHeight + gap) || (spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap);

            if (openUp) {
                top = rect.top - menuHeight - gap;
            } else {
                top = rect.bottom + gap;
            }

            if (align === 'end') {
                left = rect.right - menuWidth;
            } else {
                left = rect.left;
            }
            
            // Adjust for viewport boundaries
            if (left < 0) left = gap;
            if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - gap;
            if (top < 0) top = gap;

            setStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                width: align === 'start' ? `${rect.width}px` : undefined, // only set width if aligning to start
                zIndex: 60,
                opacity: 1,
                transition: 'opacity 150ms ease-in-out',
                pointerEvents: 'auto',
            });
        };

        calculatePosition(); // Initial calculation
        
        // Use a single RAF to recalculate on scroll/resize for performance
        let frameId: number;
        const onUpdate = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(calculatePosition);
        };
        
        window.addEventListener('scroll', onUpdate, true);
        window.addEventListener('resize', onUpdate);

        return () => {
            window.removeEventListener('scroll', onUpdate, true);
            window.removeEventListener('resize', onUpdate);
            cancelAnimationFrame(frameId);
        };
    }, [isOpen, triggerRef, menuRef, gap, align, preferredPosition]);

    return style;
};
