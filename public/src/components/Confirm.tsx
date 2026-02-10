import React, { useState, useCallback, useEffect } from 'react';

export type ConfirmType = 'default' | 'warning' | 'danger' | 'info';

export interface ConfirmState {
  id: string;
  type: ConfirmType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// 全局 Confirm 状态管理
let globalConfirm: ConfirmState | null = null;
let globalListeners: ((confirm: ConfirmState | null) => void)[] = [];

const notifyListeners = () => {
  globalListeners.forEach(listener => listener(globalConfirm ? { ...globalConfirm } : null));
};

const showConfirm = (
  type: ConfirmType,
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText?: string,
  cancelText?: string
) => {
  const id = Date.now().toString();
  globalConfirm = { id, type, title, message, onConfirm, onCancel, confirmText, cancelText };
  notifyListeners();
  return id;
};

// 独立的 Confirm 组件
export const ConfirmComponent: React.FC = () => {
  const [confirm, setConfirm] = useState<ConfirmState | null>(globalConfirm);

  useEffect(() => {
    const listener = (newConfirm: ConfirmState | null) => {
      setConfirm(newConfirm);
    };

    globalListeners.push(listener);

    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  if (!confirm) return null;

  const handleConfirm = () => {
    confirm.onConfirm();
    hideConfirm();
  };

  const handleCancel = () => {
    if (confirm.onCancel) {
      confirm.onCancel();
    }
    hideConfirm();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div
        className={`
          relative z-10 w-full max-w-md mx-4
          bg-black/60 border-2 rounded-xl
          backdrop-blur-md shadow-2xl
          transform transition-all duration-300
          ${getConfirmStyles(confirm.type)}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          {getConfirmIcon(confirm.type)}
          <h3 className="text-lg font-bold text-white">{confirm.title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-white/80">{confirm.message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={handleCancel}
            className={`
              px-4 py-2 rounded-lg font-bold text-sm transition-all
              bg-white/5 border border-white/20 text-white/80
              hover:bg-white/10 hover:text-white
            `}
          >
            {confirm.cancelText || '取消'}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 rounded-lg font-bold text-sm transition-all
              ${getConfirmButtonStyles(confirm.type)}
            `}
          >
            {confirm.confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const useConfirm = () => {
  const confirmModal = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    type: ConfirmType = 'default',
    onCancel?: () => void,
    options?: { confirmText?: string; cancelText?: string }
  ) => {
    return showConfirm(type, title, message, onConfirm, onCancel, options?.confirmText, options?.cancelText);
  }, []);

  return { confirm: confirmModal };
};

const hideConfirm = () => {
  globalConfirm = null;
  notifyListeners();
};

const getConfirmStyles = (type: ConfirmType): string => {
  const baseStyles = 'bg-black/60 border-white/20';

  switch (type) {
    case 'warning':
      return `${baseStyles} border-yellow-500/50`;
    case 'danger':
      return `${baseStyles} border-red-500/50`;
    case 'info':
      return `${baseStyles} border-blue-500/50`;
    default:
      return `${baseStyles}`;
  }
};

const getConfirmButtonStyles = (type: ConfirmType): string => {
  switch (type) {
    case 'warning':
      return 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/30';
    case 'danger':
      return 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30';
    case 'info':
      return 'bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30';
    default:
      return 'bg-ru-primary text-black hover:bg-ru-primary/80';
  }
};

const getConfirmIcon = (type: ConfirmType): React.ReactNode => {
  switch (type) {
    case 'warning':
      return (
        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'danger':
      return (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6 text-ru-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};