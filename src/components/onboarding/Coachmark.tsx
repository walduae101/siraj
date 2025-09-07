'use client';

import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { X } from 'lucide-react';

interface CoachmarkProps {
  id: string;
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export default function Coachmark({ 
  id, 
  text, 
  placement = 'bottom',
  children,
  className = ''
}: CoachmarkProps) {
  const key = `coachmark:${id}`;
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if coachmark has been dismissed
    const dismissed = localStorage.getItem(key);
    if (dismissed) {
      setShow(false);
      return;
    }

    // Show coachmark after a short delay
    const timer = setTimeout(() => {
      setShow(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [key]);

  const handleDismiss = () => {
    localStorage.setItem(key, '1');
    setShow(false);
  };

  const getPositionStyles = () => {
    switch (placement) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default:
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
    }
  };

  if (!show) {
    return children ? <>{children}</> : null;
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <div
        className="fixed z-50 p-4 rounded-lg shadow-lg bg-black text-white text-sm max-w-xs"
        style={getPositionStyles()}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1">{text}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-gray-300 p-0 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-gray-300 text-xs"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for programmatically showing coachmarks
export function useCoachmark(id: string) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`coachmark:${id}`);
    setIsDismissed(!!dismissed);
  }, [id]);

  const dismiss = () => {
    localStorage.setItem(`coachmark:${id}`, '1');
    setIsDismissed(true);
  };

  const reset = () => {
    localStorage.removeItem(`coachmark:${id}`);
    setIsDismissed(false);
  };

  return { isDismissed, dismiss, reset };
}
