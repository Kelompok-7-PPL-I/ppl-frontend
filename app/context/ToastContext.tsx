"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "info" | "success" | "warning" | "danger";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    info:    (title: string, message?: string) => void;
    success: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    danger:  (title: string, message?: string) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = {
    info:    (title: string, message?: string) => add("info", title, message),
    success: (title: string, message?: string) => add("success", title, message),
    warning: (title: string, message?: string) => add("warning", title, message),
    danger:  (title: string, message?: string) => add("danger", title, message),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}