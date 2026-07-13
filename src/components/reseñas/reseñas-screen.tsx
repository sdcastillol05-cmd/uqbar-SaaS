"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Star, MapPin, ExternalLink, Save, QrCode, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GeneradorQR } from "@/components/encuesta/generador-qr";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ReseñasScreenProps {
  userId: string;
  nombreNegocio: string;
  showToast: (msg: string, type?: "success" | "error") => void;
}

interface Encuesta {
  id: string;
  puntuacion: number;
  nombre: string | null;
  created_at: string;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
    timeZone: "America/Bogota",
  });
}

export function ReseñasScreen({ userId, nombreNegocio, showToast }: ReseñasScreenProps) {
  const [mapsUrl, setMapsUrl]     = useState("");
  const [draftUrl, setDraftUrl]   = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [tab, setTab]             = useState<"qr" | "encuestas">("qr");

  const loadData = useCallback(async () => {
    const [{ data: perfil }, { data: encs }] = await Promise.all([
      supabase.from("perfiles").select("maps_url").eq("user_id", userId).single(),
      supabase.from("encuestas").select("id, puntuacion, nombre, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);
    if (perfil?.maps_url) { setMapsUrl(perfil.maps_url); setDraftUrl(perfil.maps_url); }
    setEncuestas(encs ?? []);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSaveMaps() {
    setSavingUrl(true);
    const { error } = await supabase
      .from("perfiles")
      .update({ maps_url: draftUrl.trim() || null })
      .eq("user_id", userId);
    setSavingUrl(false);
    if (error) { showToast("No se pudo guardar.", "error"); return; }
    setMapsUrl(draftUrl.trim());
    showToast("Link de Maps guardado ✓", "success");
  }

  // Stats
  const totalEncuestas = encuestas.length;
  const promedio = totalEncuestas > 0
    ? encuestas.reduce((s, e) => s + e.puntuacion, 0) / totalEncuestas
    : 0;
  const distribucion = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: encuestas.filter((e) => e.puntuacion === n).length,
    pct:   totalEncuestas > 0
      ? Math.round((encuestas.filter((e) => e.puntuacion === n).length / totalEncuestas) * 100)
      : 0,
  }));

  const TABS = [
    { key: "qr"       as const, label: "QR y código",  icon: QrCode },
    { key: "encuestas"as const, label: "Encuestas",     icon: BarChart3 },
  ];

  return (
    <div className="max-w-[1320px] mx-auto px-8 pb-8">
      <header className="relative py-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-display text-[1.85rem] mb-1.5"
        >
          Reseñas y satisfacción
        </motion.h1>
        <p className="text-[0.92rem] text-muted-foreground">
          Tu QR de encuesta, los resultados y tu página de Google Maps.
        </p>
        <div className="absolute -bottom-1 left-0 w-40 h-px bg-gradient-to-r from-primary via-[#00bbff] to-transparent opacity-50" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Columna principal */}
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex gap-0.5 bg-secondary rounded-[11px] p-0.5 w-fit">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  tab === key ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />{label}
              </button>
            ))}
          </div>

          {tab === "qr" && (
            <GeneradorQR
              negocioId={userId}
              nombreNegocio={nombreNegocio}
              mapsUrl={mapsUrl || null}
            />
          )}

          {tab === "encuestas" && (
            <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
              {totalEncuestas === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary border flex items-center justify-center text-muted-foreground">
                    <Star className="size-5" />
                  </div>
                  <p className="font-bold text-sm">Aún sin encuestas</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Cuando tus clientes escaneen el QR y llenen la encuesta, los resultados aparecen aquí.
                  </p>
                </div>
              ) : (
                <>
                  {/* Resumen */}
                  <div className="flex items-center gap-6 px-5 py-5 border-b flex-wrap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-display text-4xl">{promedio.toFixed(1)}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={cn("size-4",
                            promedio >= n ? "fill-[#FFB020] text-[#FFB020]" : "text-muted-foreground/30"
                          )} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{totalEncuestas} reseña{totalEncuestas !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-[180px]">
                      {distribucion.map(({ n, count, pct }) => (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-muted-foreground text-right">{n}</span>
                          <Star className="size-3 fill-[#FFB020] text-[#FFB020] shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-[#FFB020]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-7 text-muted-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lista */}
                  {encuestas.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-secondary">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={cn("size-3.5",
                            e.puntuacion >= n ? "fill-[#FFB020] text-[#FFB020]" : "text-muted-foreground/30"
                          )} />
                        ))}
                      </div>
                      <span className="text-sm flex-1 text-muted-foreground">
                        {e.nombre ?? "Anónimo"}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtFecha(e.created_at)}</span>
                    </div>
                  ))}
                </>
              )}
            </Card>
          )}
        </div>

        {/* Columna lateral — configuración Maps */}
        <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <MapPin className="size-3.5 text-accent-foreground" />
            </div>
            <span className="text-display text-sm">Tu página de Google Maps</span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cuando un cliente termine la encuesta, lo redirigimos a tu página de Google Maps para que deje una reseña pública.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Link de Google Maps
              </Label>
              <Input
                placeholder="https://maps.app.goo.gl/..."
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Busca tu negocio en Maps → Compartir → Copiar enlace
              </p>
            </div>
            {draftUrl && draftUrl !== mapsUrl && (
              <Button onClick={handleSaveMaps} disabled={savingUrl} className="gap-2 glow-primary">
                <Save className="size-4" />
                {savingUrl ? "Guardando…" : "Guardar link"}
              </Button>
            )}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-accent-foreground hover:underline">
                <ExternalLink className="size-3.5" />
                Ver mi página en Maps
              </a>
            )}
            {!mapsUrl && (
              <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2.5 border">
                Sin link configurado — el logo de Google aparece en el QR pero no redirige a ningún lado hasta que lo agregues.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
