"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  variant?: "default" | "error" | "success";
};

const ToastContext = createContext<{ toast: (toast: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((next: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((items) => [...items, { ...next, id }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 end-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={cn(
                "rounded-md border bg-card px-4 py-3 text-sm shadow-soft",
                item.variant === "error" && "border-destructive text-destructive",
                item.variant === "success" && "border-primary text-foreground"
              )}
            >
              {item.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
