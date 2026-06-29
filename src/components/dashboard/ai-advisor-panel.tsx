"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIAdvisorPanelProps {
  advice: string[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AIAdvisorPanel({
  advice,
  loading,
  error,
  onRefresh,
}: AIAdvisorPanelProps) {
  return (
    <Card className="relative p-0 gap-0 overflow-hidden border-card-foreground/5">
      {/* Abstract gradient glow living behind the whole card */}
      <div
        className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, var(--primary), color-mix(in srgb, #00bbff 60%, transparent) 55%, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-16 w-56 h-56 rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle, #00e0a4, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-start gap-4 px-6 py-5.5 border-b">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#9163ff] via-primary to-[#00bbff] shadow-[0_4px_20px_color-mix(in_srgb,var(--primary)_45%,transparent)] shrink-0">
          <Sparkles className="size-[18px] text-white" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-display text-[1.05rem]">Asesor IA</span>
          <span className="text-[0.8rem] text-muted-foreground">
            Ideas generadas según tu actividad
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto size-8.5 shrink-0"
          title="Actualizar"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="relative z-10 p-6 flex flex-col gap-3 min-h-[180px]">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-sm text-muted-foreground py-3"
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </span>
              <span className="ml-1">Analizando tu negocio…</span>
            </motion.div>
          )}

          {!loading && error && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          {!loading && !error && advice.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              Registra algunos movimientos para recibir consejos
              personalizados aquí.
            </motion.p>
          )}

          {!loading && !error && advice.length > 0 && (
            <motion.div
              key="advice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              {advice.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex items-start gap-3.5 bg-secondary border rounded-2xl px-4.5 py-4 text-sm leading-[1.65]"
                >
                  <span className="shrink-0 w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-accent to-accent/60 text-accent-foreground flex items-center justify-center text-display text-[0.76rem] mt-0.5">
                    {i + 1}
                  </span>
                  {/* flex-1 + min-w-0 lets long sentences wrap naturally
                      instead of being clipped by the flex container */}
                  <span className="flex-1 min-w-0 break-words">{line}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
