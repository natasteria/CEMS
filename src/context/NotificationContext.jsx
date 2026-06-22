import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info',
    mode: 'notice',
    onConfirm: null,
    onCancel: null
  });

  const showNotification = useCallback((message, type = 'info', mode = 'notice', options = {}) => {
    setNotification({
      show: true,
      message,
      type,
      mode,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    if (notification.show && notification.mode === 'notice') {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.mode, hideNotification]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle2 className="text-unity-yellow" size={20} />;
      case 'error': return <AlertCircle className="text-rose-500" size={20} />;
      case 'warning': return <AlertCircle className="text-unity-yellow" size={20} />;
      default: return <Info className="text-unity-yellow" size={20} />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Confirm Action';
      default: return 'Notice';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(94vw,420px)] animate-in fade-in slide-in-from-top-6 duration-500 ease-out">
          <div className="rounded-2xl border border-white/10 bg-unity-navy/95 p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
                  {getIcon()}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-unity-yellow/90">
                    {getTitle()}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-white/95 leading-relaxed antialiased">
                    {notification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (notification.onCancel) notification.onCancel();
                  hideNotification();
                }}
                className="mt-1 rounded-lg p-1.5 text-white/40 transition-all hover:text-white hover:bg-white/10 active:scale-90"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>

            {notification.mode === 'confirm' && (
              <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    if (notification.onCancel) notification.onCancel();
                    hideNotification();
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (notification.onConfirm) notification.onConfirm();
                    hideNotification();
                  }}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-unity-yellow px-5 py-2.5 text-xs font-black uppercase tracking-widest text-unity-navy transition-all hover:brightness-110 active:scale-[0.97] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
