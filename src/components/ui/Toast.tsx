'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '~/lib/utils';
import { isRTLLocale } from '../rtl';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'border-green-500/20 bg-green-500/5 text-green-400',
  error: 'border-red-500/20 bg-red-500/5 text-red-400',
  warning: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
  info: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Track toast telemetry
    if (typeof window !== 'undefined') {
      // Import analytics dynamically to avoid SSR issues
      import('~/lib/analytics').then(({ track }) => {
        track('ux.toast_shown', {
          type: toast.type,
          title: toast.title,
          hasDescription: !!toast.description,
        });
      });
    }

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const isRTL = isRTLLocale();

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 p-4',
        isRTL ? 'left-4 top-4' : 'right-4 top-4'
      )}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
            isRTL={isRTL}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
  isRTL: boolean;
}

function ToastItem({ toast, onRemove, isRTL }: ToastItemProps) {
  const Icon = toastIcons[toast.type];
  const styleClass = toastStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? 300 : -300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isRTL ? 300 : -300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative max-w-sm w-full rounded-lg border backdrop-blur-sm p-4 shadow-lg',
        styleClass
      )}
    >
      <div className={cn('flex items-start gap-3', isRTL ? 'flex-row-reverse' : 'flex-row')}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs opacity-80 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="إغلاق الإشعار"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
