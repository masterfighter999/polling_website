'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timerMap = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    // Clean up all pending timeouts on unmount
    useEffect(() => {
        return () => {
            timerMap.current.forEach(timer => clearTimeout(timer));
            timerMap.current.clear();
        };
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, message, type }]);
        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timerMap.current.delete(id);
        }, 3500);
        timerMap.current.set(id, timer);
    }, []);

    const dismiss = useCallback((id: number) => {
        // Clear the auto-dismiss timeout when manually dismissed
        const timer = timerMap.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timerMap.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const iconMap: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    const colorMap: Record<ToastType, { bg: string; border: string; accent: string }> = {
        success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', accent: '#22c55e' },
        error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', accent: '#ef4444' },
        info: { bg: 'rgba(124,92,255,0.15)', border: 'rgba(124,92,255,0.3)', accent: '#7C5CFF' },
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    pointerEvents: 'none',
                    maxWidth: 'calc(100vw - 48px)',
                }}
            >
                <AnimatePresence>
                    {toasts.map(toast => {
                        const colors = colorMap[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                role={toast.type === 'error' ? 'alert' : 'status'}
                                aria-live="assertive"
                                aria-atomic="true"
                                aria-label={`${toast.type}: ${toast.message}`}
                                tabIndex={0}
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                onClick={() => dismiss(toast.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') {
                                        dismiss(toast.id);
                                    }
                                }}
                                style={{
                                    pointerEvents: 'auto',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 20px',
                                    borderRadius: '16px',
                                    background: colors.bg,
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    border: `1px solid ${colors.border}`,
                                    color: '#EDEDED',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    minWidth: '260px',
                                    maxWidth: '380px',
                                    outline: 'none',
                                }}
                            >
                                <span
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: colors.accent,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: '#fff',
                                        flexShrink: 0,
                                    }}
                                >
                                    {iconMap[toast.type]}
                                </span>
                                <span style={{ flex: 1 }}>{toast.message}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
