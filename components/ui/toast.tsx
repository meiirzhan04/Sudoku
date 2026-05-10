"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  variant?: "default" | "error" | "success" | "info";
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
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className={cn(
                "flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm shadow-soft",
                item.variant === "error" && "border-destructive text-destructive",
                item.variant === "success" && "border-primary text-foreground",
                item.variant === "info" && "border-sky-400/50 text-foreground"
              )}
            >
              {item.variant === "success" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
              {item.variant === "error" ? <XCircle className="h-4 w-4 text-destructive" /> : null}
              {item.variant === "info" || !item.variant ? <Info className="h-4 w-4 text-sky-400" /> : null}
              <span>{item.title}</span>
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
