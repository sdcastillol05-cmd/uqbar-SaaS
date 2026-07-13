"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Star, Phone, User, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SUBMIT_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-encuesta`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface PaginaEncuestaProps {
  negocioId: string;
}

type Step = "estrellas" | "contacto" | "gracias";

const LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "¡Excelente!",
};

export function PaginaEncuesta({ negocioId }: PaginaEncuestaProps) {
  const [step, setStep]           = useState<Step>("estrellas");
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover]         = useState(0);
  const [quiereContacto, setQuiereContacto] = useState<boolean | null>(null);
  const [nombre, setNombre]       = useState("");
  const [telefono, setTelefono]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [mapsUrl, setMapsUrl]     = useState<string | null>(null);

  // Derived directly from the prop — no useEffect needed since this
  // is just a boolean check on a prop value, not an external system sync.
  const negocioValido = Boolean(negocioId);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          negocio_id: negocioId,
          puntuacion,
          nombre:   quiereContacto && nombre.trim() ? nombre.trim() : null,
          telefono: quiereContacto && telefono.trim() ? telefono.trim() : null,
        }),
      });
      const data = await res.json();
      if (data.maps_url) setMapsUrl(data.maps_url);
      setStep("gracias");
    } catch {
      // igual mostramos gracias aunque falle
      setStep("gracias");
    } finally {
      setLoading(false);
    }
  }

  function handleEstrella(n: number) {
    setPuntuacion(n);
    // Avanzar automáticamente después de un pequeño delay
    setTimeout(() => setStep("contacto"), 400);
  }

  if (negocioValido === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <p className="text-muted-foreground">Enlace no válido. Contacta al negocio.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      {/* Fondo sutil */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute w-[600px] h-[600px] rounded-full -top-1/4 -left-1/4 blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 40%, transparent), transparent 65%)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full -bottom-1/4 -right-1/4 blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, #00bbff 30%, transparent), transparent 65%)" }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logouq.png" alt="Uqbar" width={32} height={32} className="rounded-lg" />
          <span className="text-display text-lg">Uqbar</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── PASO 1: ESTRELLAS ── */}
          {step === "estrellas" && (
            <motion.div key="estrellas"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9163ff] to-primary flex items-center justify-center shadow-[0_4px_20px_color-mix(in_srgb,var(--primary)_40%,transparent)]">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-display text-2xl mb-2">¿Cómo estuvo tu experiencia?</h1>
                <p className="text-muted-foreground text-sm">Tu opinión ayuda a mejorar el servicio.</p>
              </div>

              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => handleEstrella(n)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "size-10 transition-colors",
                        (hover || puntuacion) >= n
                          ? "fill-[#FFB020] text-[#FFB020]"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>

              {(hover > 0 || puntuacion > 0) && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm font-semibold text-accent-foreground"
                >
                  {LABELS[hover || puntuacion]}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ── PASO 2: CONTACTO ── */}
          {step === "contacto" && (
            <motion.div key="contacto"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              {/* Resumen de estrellas */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn("size-5", puntuacion >= n ? "fill-[#FFB020] text-[#FFB020]" : "text-muted-foreground/30")} />
                ))}
              </div>

              <div className="text-center">
                <h2 className="text-display text-xl mb-1">¡Gracias por tu opinión!</h2>
                <p className="text-muted-foreground text-sm">
                  ¿Quieres que te contactemos para futuras citas o promociones?
                </p>
              </div>

              {/* Sí / No */}
              {quiereContacto === null && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuiereContacto(true)}
                    className="flex-1 py-3 rounded-xl border-2 border-primary bg-primary/10 text-primary font-bold text-sm transition-colors hover:bg-primary/20"
                  >
                    Sí, claro
                  </button>
                  <button
                    onClick={() => { setQuiereContacto(false); handleSubmit(); }}
                    className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm transition-colors hover:bg-secondary"
                  >
                    No, gracias
                  </button>
                </div>
              )}

              {/* Formulario si dijo Sí */}
              <AnimatePresence>
                {quiereContacto === true && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tu nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input placeholder="Juan Pérez" className="pl-9"
                          value={nombre} onChange={(e) => setNombre(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tu WhatsApp</Label>
                      <div className="flex gap-2">
                        <span className="flex items-center px-3 rounded-md border bg-secondary text-sm text-muted-foreground shrink-0">
                          🇨🇴 +57
                        </span>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="3001234567"
                            className="pl-9"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !nombre.trim() || telefono.length < 10}
                      className="w-full gap-2 glow-primary mt-1"
                    >
                      {loading ? "Enviando…" : "Enviar y continuar"}
                      {!loading && <ArrowRight className="size-4" />}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── PASO 3: GRACIAS + REDIRECT MAPS ── */}
          {step === "gracias" && (
            <motion.div key="gracias"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center shadow-[0_0_24px_color-mix(in_srgb,var(--success)_30%,transparent)]">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div>
                <h2 className="text-display text-2xl mb-2">¡Muchas gracias!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tu opinión es muy valiosa para nosotros.
                  {mapsUrl && " Si quieres, puedes dejarnos una reseña en Google Maps."}
                </p>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 w-full py-3.5 px-4 rounded-xl border bg-card hover:bg-secondary transition-colors text-sm font-semibold"
                >
                  {/* Google G logo inline SVG */}
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Déjanos una reseña en Google Maps
                  <ArrowRight className="size-4 ml-auto text-muted-foreground" />
                </a>
              )}

              <p className="text-xs text-muted-foreground">
                Powered by <strong>Uqbar</strong>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
