"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, X, Sparkles, Settings, MessageSquareCheck,
  CheckCheck, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notificacion } from "@/hooks/use-notificaciones";
import { cn } from "@/lib/utils";

interface NotificacionesPanelProps {
  notificaciones: Notificacion[];
  count: number;
  open: boolean;
  onToggle: () => void;
  onDescartar: (id: string) => void;
  onDescartarTodas: () => void;
}

const TIPO_CONFIG = {
  ia: {
    icon: Sparkles,
    color: "#9163ff",
    label: "IA",
  },
  sistema: {
    icon: Settings,
    color: "#00BBFF",
    label: "Sistema",
  },
  recordatorio: {
    icon: MessageSquareCheck,
    color: "#00E0A4",
    label: "WhatsApp",
  },
};

function fmtTiempo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Ahora";
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${days} d`;
}

export function NotificacionesPanel({
  notificaciones,
  count,
  open,
  onToggle,
  onDescartar,
  onDescartarTodas,
}: NotificacionesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onToggle]);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={onToggle}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors",
          open
            ? "bg-accent border-accent-foreground/20 text-accent-foreground"
            : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        title="Notificaciones"
      >
        <Bell className="size-[15px]" />
        {/* Badge */}
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[0.65rem] font-bold flex items-center justify-center leading-none shadow-[0_0_8px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Floating panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-2 w-[340px] bg-card border border-card-foreground/10",
              "rounded-2xl shadow-2xl overflow-hidden",
              // Desktop: align to right edge of button
              // Mobile: stretch to near-full width, anchored right
              "right-0 sm:right-0",
              "max-w-[calc(100vw-2rem)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-display text-[0.875rem]">Notificaciones</span>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({count} nueva{count !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={onDescartarTodas}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Descartar todas"
                >
                  <CheckCheck className="size-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[380px]">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary border flex items-center justify-center text-muted-foreground">
                    <Inbox className="size-4" />
                  </div>
                  <p className="text-sm font-semibold">Todo al día</p>
                  <p className="text-xs text-muted-foreground">
                    Aquí aparecerán alertas de IA, recordatorios enviados y avisos del sistema.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notificaciones.map((n) => {
                    const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="group flex items-start gap-3 px-4 py-3.5 border-b last:border-0 hover:bg-secondary transition-colors"
                      >
                        {/* Type icon */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${cfg.color} 14%, var(--card))`,
                            boxShadow: `0 0 10px color-mix(in srgb, ${cfg.color} 25%, transparent)`,
                          }}
                        >
                          <Icon className="size-3.5" style={{ color: cfg.color }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.82rem] font-semibold leading-snug">
                            {n.titulo}
                          </p>
                          <p className="text-[0.78rem] text-muted-foreground mt-0.5 leading-snug">
                            {n.mensaje}
                          </p>
                          <p className="text-[0.7rem] text-muted-foreground/60 mt-1.5">
                            {fmtTiempo(n.created_at)}
                          </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={() => onDescartar(n.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5 shrink-0 mt-0.5"
                          title="Descartar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
