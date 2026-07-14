"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Sparkles, Users, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

interface Step {
  id: string;
  icon: React.ElementType;
  color: string;
  title: string;
  text: string;
  // selector CSS del elemento a resaltar
  target: string;
  // posición del tooltip relativa al target
  placement: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    id: "ia",
    icon: Sparkles,
    color: "#9163ff",
    title: "Tu asesor de IA",
    text: "Analiza tu negocio y te da consejos personalizados. Toca el botón ↻ para actualizarlos.",
    target: "[data-onboarding='ai-panel']",
    placement: "left",
  },
  {
    id: "clientes",
    icon: Users,
    color: "#00BBFF",
    title: "Clientes y recordatorios",
    text: "Guarda tus clientes y programa mensajes automáticos por WhatsApp para que vuelvan.",
    target: "[data-onboarding='tab-clientes']",
    placement: "bottom",
  },
  {
    id: "resenas",
    icon: QrCode,
    color: "#00E0A4",
    title: "Tu QR de reseñas",
    text: "Genera un código QR para que tus clientes califiquen el servicio y te dejen reseñas en Google.",
    target: "[data-onboarding='tab-resenas']",
    placement: "bottom",
  },
];

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export function OnboardingTour({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const currentStep = STEPS[step];

  // Measure target element position
  useEffect(() => {
    const measure = () => {
      const r = getTargetRect(currentStep.target);
      setRect(r);
    };
    // Small delay to let the DOM settle
    const t = setTimeout(() => {
      measure();
      setVisible(true);
    }, 300);
    return () => clearTimeout(t);
  }, [step, currentStep.target]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener("resize", () => {
      setRect(getTargetRect(currentStep.target));
    });
    return () => window.removeEventListener("resize", () => {});
  }, [currentStep.target]);

  async function finish() {
    setVisible(false);
    await supabase
      .from("perfiles")
      .update({ onboarding_completado: true })
      .eq("user_id", userId);
    setTimeout(onComplete, 300);
  }

  function next() {
    setVisible(false);
    setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        finish();
      }
    }, 200);
  }

  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;

  // Tooltip position relative to target
  function tooltipStyle(): React.CSSProperties {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const GAP = 16;
    const scrollY = window.scrollY;

    switch (currentStep.placement) {
      case "bottom":
        return {
          top:  rect.bottom + scrollY + GAP,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          top:  rect.top + scrollY - GAP,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "left":
        return {
          top:  rect.top + scrollY + rect.height / 2,
          left: rect.left - GAP,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top:  rect.top + scrollY + rect.height / 2,
          left: rect.right + GAP,
          transform: "translateY(-50%)",
        };
    }
  }

  // Spotlight padding around the target
  const PAD = 8;
  const spotlightStyle = rect
    ? {
        top:    rect.top + window.scrollY - PAD,
        left:   rect.left - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Dark overlay with hole */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.55)",
              WebkitMaskImage: spotlightStyle
                ? `radial-gradient(ellipse ${spotlightStyle.width + 20}px ${spotlightStyle.height + 20}px at ${spotlightStyle.left + spotlightStyle.width / 2}px ${spotlightStyle.top + spotlightStyle.height / 2}px, transparent 60%, black 75%)`
                : "none",
              maskImage: spotlightStyle
                ? `radial-gradient(ellipse ${spotlightStyle.width + 20}px ${spotlightStyle.height + 20}px at ${spotlightStyle.left + spotlightStyle.width / 2}px ${spotlightStyle.top + spotlightStyle.height / 2}px, transparent 60%, black 75%)`
                : "none",
            }}
          />

          {/* Spotlight ring around target */}
          {spotlightStyle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[81] rounded-xl pointer-events-none"
              style={{
                ...spotlightStyle,
                boxShadow: `0 0 0 3px ${currentStep.color}, 0 0 24px color-mix(in srgb, ${currentStep.color} 50%, transparent)`,
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[82] w-[280px] bg-card border border-card-foreground/10 rounded-2xl shadow-2xl p-5"
            style={tooltipStyle()}
          >
            {/* Arrow indicator */}
            {currentStep.placement === "bottom" && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
                <div className="w-3 h-3 bg-card border-l border-t border-card-foreground/10 rotate-45 translate-y-1 mx-auto" />
              </div>
            )}
            {currentStep.placement === "left" && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-4 overflow-hidden">
                <div className="w-3 h-3 bg-card border-r border-t border-card-foreground/10 rotate-45 -translate-x-1 my-auto" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, ${currentStep.color} 15%, var(--card))`,
                  boxShadow: `0 0 12px color-mix(in srgb, ${currentStep.color} 30%, transparent)`,
                }}
              >
                <Icon className="size-4" style={{ color: currentStep.color }} />
              </div>
              <span className="text-display text-[0.9rem]">{currentStep.title}</span>
              <button
                onClick={finish}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <p className="text-[0.82rem] text-muted-foreground leading-relaxed mb-4">
              {currentStep.text}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: i === step ? currentStep.color : "var(--border)",
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
                  className="h-7 text-xs gap-1.5 px-3"
                  style={{ backgroundColor: currentStep.color }}
                >
                  {isLast ? "¡Listo!" : "Siguiente"}
                  {!isLast && <ArrowRight className="size-3" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
