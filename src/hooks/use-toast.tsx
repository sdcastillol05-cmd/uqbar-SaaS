"use client";

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ToastState {
  message: string;
  type: "success" | "error" | "default";
  id: number;
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "default" = "default") => {
      idRef.current += 1;
      setToastState({ message, type, id: idRef.current });
    },
    []
  );

  const ToastPortal = useCallback(() => {
    if (typeof document === "undefined") return null;
    return createPortal(
      <AnimatePresence
        onExitComplete={() => {}}
      >
        {toastState && (
          <motion.div
            key={toastState.id}
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ duration: 0.25 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                setToastState((cur) =>
                  cur?.id === toastState.id ? null : cur
                );
              }, 2500);
            }}
            className={
              "fixed bottom-6 left-1/2 z-[9999] flex items-center gap-2 rounded-xl border bg-popover px-4.5 py-2.75 text-sm font-semibold shadow-2xl " +
              (toastState.type === "success"
                ? "border-success/30"
                : toastState.type === "error"
                ? "border-destructive/30"
                : "")
            }
          >
            {toastState.type === "success" && (
              <CheckCircle className="size-[15px] text-success shrink-0" />
            )}
            {toastState.type === "error" && (
              <AlertCircle className="size-[15px] text-destructive shrink-0" />
            )}
            <span>{toastState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }, [toastState]);

  return { showToast, ToastPortal };
}
