"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecordatorioConCliente } from "@/lib/types-clientes";

interface CalendarioRecordatoriosProps {
  recordatorios: RecordatorioConCliente[];
}

const DIAS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES  = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toColombiaDate(iso: string) {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: "America/Bogota" }));
}

function fmtHora(iso: string) {
  return toColombiaDate(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export function CalendarioRecordatorios({ recordatorios }: CalendarioRecordatoriosProps) {
  const hoy   = new Date();
  const [año, setAño]   = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

  function navMes(delta: number) {
    const d = new Date(año, mes + delta, 1);
    setAño(d.getFullYear());
    setMes(d.getMonth());
    setDiaSeleccionado(null);
  }

  // Primer día de la semana del mes (lunes = 0)
  const primerDia = useMemo(() => {
    const d = new Date(año, mes, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [año, mes]);

  const diasEnMes = useMemo(() => new Date(año, mes + 1, 0).getDate(), [año, mes]);

  // Recordatorios agrupados por día del mes actual
  const porDia = useMemo(() => {
    const map: Record<number, RecordatorioConCliente[]> = {};
    recordatorios.forEach((r) => {
      const d = toColombiaDate(r.fecha_envio);
      if (d.getFullYear() === año && d.getMonth() === mes) {
        const dia = d.getDate();
        if (!map[dia]) map[dia] = [];
        map[dia].push(r);
      }
    });
    return map;
  }, [recordatorios, año, mes]);

  const recsDiaSeleccionado = diaSeleccionado ? (porDia[diaSeleccionado] ?? []) : [];

  const celdas = Array.from({ length: primerDia + diasEnMes }, (_, i) =>
    i < primerDia ? null : i - primerDia + 1
  );
  // Rellenar hasta completar semana
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
        {/* Header del calendario */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navMes(-1)} className="size-8">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-display text-base">
            {MESES[mes]} {año}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navMes(1)} className="size-8">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b">
          {DIAS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del mes */}
        <div className="grid grid-cols-7">
          {celdas.map((dia, idx) => {
            if (!dia) return <div key={`empty-${idx}`} className="aspect-square border-b border-r last:border-r-0 border-border/40" />;

            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
            const recs  = porDia[dia] ?? [];
            const tieneRecs = recs.length > 0;
            const seleccionado = diaSeleccionado === dia;
            const tienePendiente = recs.some((r) => !r.enviado);
            const tieneEnviado   = recs.some((r) => r.enviado);

            return (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(seleccionado ? null : dia)}
                className={cn(
                  "aspect-square border-b border-r last:border-r-0 border-border/40 flex flex-col items-center justify-start pt-1.5 pb-1 gap-0.5 transition-colors text-xs relative",
                  seleccionado && "bg-accent",
                  !seleccionado && tieneRecs && "hover:bg-secondary",
                  !tieneRecs && "hover:bg-secondary/50 cursor-default"
                )}
              >
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full font-semibold text-[0.75rem]",
                  esHoy && "bg-primary text-primary-foreground",
                  !esHoy && seleccionado && "text-accent-foreground",
                  !esHoy && !seleccionado && "text-foreground",
                )}>
                  {dia}
                </span>
                {tieneRecs && (
                  <div className="flex gap-0.5">
                    {tienePendiente && (
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    )}
                    {tieneEnviado && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Detalle del día seleccionado */}
      {diaSeleccionado && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
            <div className="px-5 py-3.5 border-b">
              <span className="text-display text-sm">
                {diaSeleccionado} de {MESES[mes]}
              </span>
            </div>
            {recsDiaSeleccionado.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Sin recordatorios para este día.
              </p>
            ) : (
              recsDiaSeleccionado.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 border-b last:border-0">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    r.enviado ? "bg-success/10 text-success" :
                    r.error   ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  )}>
                    {r.enviado ? <CheckCircle2 className="size-3.5" /> :
                     r.error   ? <AlertCircle  className="size-3.5" /> :
                                 <Clock        className="size-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{r.clientes?.nombre ?? "Cliente"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.motivo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtHora(r.fecha_envio)} ·{" "}
                      {r.enviado ? "Enviado" : r.error ? "Error" : "Pendiente"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </motion.div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning" /> Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" /> Enviado
        </span>
      </div>
    </div>
  );
}
