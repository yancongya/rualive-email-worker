import React, { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 全局 Toast 状态管理
let globalToasts: Toast[] = [];
let globalListeners: ((toasts: Toast[]) => void)[] = [];

const notifyListeners = () => {
  globalListeners.forEach(listener => listener([...globalToasts]));
};

const removeToast = (id: string) => {
  globalToasts = globalToasts.filter(t => t.id !== id);
  notifyListeners();
};

const addToast = (type: ToastType, message: string, duration: number = 3000) => {
  const id = Date.now().toString();
  const newToast: Toast = { id, type, message, duration };
  
  globalToasts = [...globalToasts, newToast];
  notifyListeners();
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
};

// 独立的 ToastContainer 组件
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts);
    };
    
    globalListeners.push(listener);
    
    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            min-w-[300px] max-w-md
            px-6 py-4 rounded-xl
            font-bold text-sm
            backdrop-blur-md
            shadow-2xl
            transform transition-all duration-300
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex items-center gap-3">
            {getToastIcon(toast.type)}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const success = useCallback((message: string, duration?: number) => {
    return addToast('success', message, duration);
  }, []);

  const error = useCallback((message: string, duration?: number) => {
    return addToast('error', message, duration);
  }, []);

  const info = useCallback((message: string, duration?: number) => {
    return addToast('info', message, duration);
  }, []);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast('warning', message, duration);
  }, []);

  return { success, error, info, warning };
};

const getToastStyles = (type: ToastType): string => {
  const baseStyles = 'bg-white/10 border-2';
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-500/20 border-green-500/50 text-green-300`;
    case 'error':
      return `${baseStyles} bg-red-500/20 border-red-500/50 text-red-300`;
    case 'warning':
      return `${baseStyles} bg-yellow-500/20 border-yellow-500/50 text-yellow-300`;
    case 'info':
      return `${baseStyles} bg-blue-500/20 border-blue-500/50 text-blue-300`;
    default:
      return `${baseStyles} bg-white/10 border-white/30 text-white`;
  }
};

const getToastIcon = (type: ToastType): React.ReactNode => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};