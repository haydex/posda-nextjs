"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: "info" | "success" | "error" | "warning";
};

type ToastContextType = {
  addToast: (payload: Omit<Toast, "id"> | string) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((payload: Omit<Toast, "id"> | string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast =
      typeof payload === "string"
        ? { id, message: payload }
        : { id, ...payload };

    setToasts((prev) => [toast, ...prev]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  // toasts are persistent by default; they are removed only when the user
  // clicks the dismiss button or when `removeToast` is called programmatically.

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}

      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.variant ?? "info"}`}
            role="status"
          >
            <div className="toast-content">
              <div className="toast-message">{t.message}</div>
              <button
                aria-label="Dismiss"
                className="toast-dismiss"
                onClick={() => removeToast(t.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
