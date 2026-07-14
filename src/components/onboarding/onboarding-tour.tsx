"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Sparkles, Users, QrCode, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

interface Step {
  icon: React.ElementType;
  color: string;
  title: string;
  text: string;
  hint: string; // texto pequeño que indica dónde mirar
}

const STEPS: Step[] = [
  {
    icon: TrendingUp,
    color: "#7546E8",
    title: "Registra tus movimientos",
    text: "Toca el botón "Nuevo movimiento" en la parte inferior de la pantalla para registrar ingresos y gastos.",
    hint: "↓ Mira al final de esta pantalla",
  },
  {
    icon: Sparkles,
    color: "#9163ff",
    title: "Tu asesor con IA",
    text: "El panel derecho analiza tu negocio y te da consejos personalizados. Toca ↻ para actualizarlos.",
    hint: "→ Panel derecho de esta pantalla",
  },
  {
    icon: Users,
    color: "#00BBFF",
    title: "Clientes y WhatsApp",
    text: "En la tab "Clientes" guardas tus clientes y programas recordatorios automáticos por WhatsApp.",
    hint: "↑ Tab "Clientes" en la barra superior",
  },
  {
    icon: QrCode,
    color: "#00E0A4",
    title: "Tu QR de reseñas",
    text: "En "Reseñas" generas un código QR para que tus clientes califiquen el servicio y te dejen reseñas en Google.",
    hint: "↑ Tab "Reseñas" en la barra superior",
  },
];

export function OnboardingTour({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const Icon    = current.icon;

  async function finish() {
    setExiting(true);
    await supabase
      .from("perfiles")
      .update({ onboarding_completado: true })
      .eq("user_id", userId);
    setTimeout(onComplete, 300);
  }

  function next() {
    if (isLast) { finish(); return; }
    setStep((s) => s + 1);
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <>
          {/* Overlay — semi-transparent, doesn't block content reading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
            onClick={finish}
          />

          {/* Card — centered, compact, never overlaps content it describes */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-[81] inset-0 flex items-center justify-center p-5 pointer-events-none"
          >
            <div
              className="w-full max-w-[340px] bg-card border border-card-foreground/10 rounded-2xl shadow-2xl p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${current.color} 15%, var(--card))`,
                    boxShadow: `0 0 18px color-mix(in srgb, ${current.color} 35%, transparent)`,
                  }}
                >
                  <Icon className="size-5" style={{ color: current.color }} />
                </div>
                <button
                  onClick={finish}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Text */}
              <h3 className="text-display text-[1.05rem] mb-2">{current.title}</h3>
              <p className="text-[0.85rem] text-muted-foreground leading-relaxed mb-3">
                {current.text}
              </p>

              {/* Hint — subtle directional cue */}
              <p
                className="text-[0.75rem] font-semibold mb-5 px-3 py-2 rounded-lg"
                style={{
                  color: current.color,
                  backgroundColor: `color-mix(in srgb, ${current.color} 10%, var(--card))`,
                }}
              >
                {current.hint}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-full transition-all",
                        i === step ? "w-4 h-1.5" : "w-1.5 h-1.5"
                      )}
                      style={{
                        backgroundColor: i === step ? current.color : "var(--border)",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={finish}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Saltar
                  </button>
                  <Button
                    size="sm"
                    onClick={next}
                    className="h-7 text-xs gap-1.5 px-3 border-0"
                    style={{ backgroundColor: current.color }}
                  >
                    {isLast ? "¡Listo!" : "Siguiente"}
                    {!isLast && <ArrowRight className="size-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
