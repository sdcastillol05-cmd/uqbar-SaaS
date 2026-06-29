"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, Clock3, Inbox, X } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtCOP, fmtDate, MEDIO_PAGO_LABELS } from "@/lib/format";
import type { Movimiento } from "@/lib/types";

type Filter = "todos" | "ingreso" | "gasto" | "fiado";

interface TransactionsListProps {
  movimientos: Movimiento[];
  onDelete: (id: string) => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ingreso", label: "Ingresos" },
  { key: "gasto", label: "Egresos" },
  { key: "fiado", label: "Fiado" },
];

export function TransactionsList({
  movimientos,
  onDelete,
}: TransactionsListProps) {
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered =
    filter === "todos"
      ? movimientos
      : filter === "fiado"
      ? movimientos.filter((m) => m.es_fiado)
      : movimientos.filter((m) => m.tipo === filter);

  return (
    <>
      <div className="flex items-center justify-between px-5.5 pt-3.5 pb-2.5 border-t">
        <span className="text-display text-[0.875rem]">Movimientos</span>
        <span className="text-[0.76rem] text-muted-foreground">
          {movimientos.length} registro{movimientos.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-0.5 bg-secondary rounded-[11px] p-0.5 mx-5.5 mb-3 w-fit flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[0.76rem] font-bold transition-colors",
              filter === f.key
                ? "bg-accent text-accent-foreground shadow-[0_0_12px_var(--primary)_inset]/30"
                : "text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ScrollArea className="h-[380px]">
        {filtered.length === 0 ? (
          <div className="py-12 px-5 text-center">
            <div className="w-11.5 h-11.5 rounded-2xl bg-secondary border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Inbox className="size-5" />
            </div>
            <p className="font-bold text-[0.88rem] mb-1">
              Sin{" "}
              {filter === "todos"
                ? "movimientos"
                : filter === "fiado"
                ? "fiados"
                : filter === "ingreso"
                ? "ingresos"
                : "egresos"}{" "}
              aún
            </p>
            <p className="text-[0.78rem] text-muted-foreground">
              Registra el primero con el botón inferior
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((m) => {
              const isIngreso = m.tipo === "ingreso";
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-3 px-5.5 py-2.75 border-b last:border-0 hover:bg-secondary"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0",
                      isIngreso
                        ? "bg-success/10 text-success shadow-[0_0_10px_var(--success)_inset]/30"
                        : "bg-destructive/10 text-destructive shadow-[0_0_10px_var(--destructive)_inset]/30"
                    )}
                  >
                    {isIngreso ? (
                      <ArrowDownLeft className="size-3.5" />
                    ) : (
                      <ArrowUpRight className="size-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[0.875rem] font-semibold truncate">
                        {m.concepto}
                      </span>
                      {m.es_fiado && (
                        <Badge className="gap-1 bg-warning/10 text-warning border-0 text-[0.66rem] px-2 shadow-[0_0_10px_var(--warning)_inset]/25">
                          <Clock3 className="size-2.5" />
                          Fiado
                        </Badge>
                      )}
                      {m.medio_pago && (
                        <Badge
                          variant="outline"
                          className="text-[0.66rem] px-2 text-muted-foreground border-border"
                        >
                          {MEDIO_PAGO_LABELS[m.medio_pago] ?? m.medio_pago}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[0.72rem] text-muted-foreground mt-0.5">
                      {fmtDate(m.fecha)}
                      {m.cliente ? ` · ${m.cliente}` : ""}
                      {m.nota ? ` · ${m.nota}` : ""}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-display text-[0.9375rem] shrink-0",
                      isIngreso ? "text-success" : "text-destructive"
                    )}
                  >
                    {isIngreso ? "+" : "−"} {fmtCOP(m.valor)}
                  </span>

                  <button
                    onClick={() => onDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1 rounded-md shrink-0"
                    title="Eliminar"
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </ScrollArea>
    </>
  );
}
