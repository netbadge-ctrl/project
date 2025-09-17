import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipPortalProps {
  children: React.ReactNode;
  targetRect: DOMRect;
}

export const TooltipPortal: React.FC<TooltipPortalProps> = ({ children, targetRect }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    opacity: 0,
    transform: 'translateY(10px)',
    transition: 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
    pointerEvents: 'none',
  });

  useEffect(() => {
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      const gap = 12;

      let top = targetRect.bottom + gap;
      let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

      // Adjust if it goes off-screen vertically
      if (top + tooltipRect.height > innerHeight && targetRect.top > tooltipRect.height + gap) {
        top = targetRect.top - tooltipRect.height - gap;
      }

      // Adjust if it goes off-screen horizontally
      if (left < 0) {
        left = gap;
      }
      if (left + tooltipRect.width > innerWidth) {
        left = innerWidth - tooltipRect.width - gap;
      }

      // Final check to prevent going off top of screen
      if (top < 0) {
          top = gap;
      }

      setStyle(prev => ({ ...prev, top: `${top}px`, left: `${left}px`, opacity: 1, transform: 'translateY(0)' }));
    }
  }, [targetRect]);

  const portalElement = typeof document !== 'undefined' ? document.body : null;

  if (!portalElement) {
    return null;
  }

  return ReactDOM.createPortal(
    <div ref={tooltipRef} style={style}>
      {children}
    </div>,
    portalElement
  );
};
