"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  PencilLine,
  Calendar,
  CreditCard,
  User,
  Check,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/format";
import type { TipoMovimiento, MedioPago, NuevoMovimiento } from "@/lib/types";

interface AddTransactionFormProps {
  onSubmit: (mov: NuevoMovimiento) => Promise<{ error: unknown }>;
  onSuccess: (tipo: TipoMovimiento) => void;
  onError: () => void;
}

export function AddTransactionForm({
  onSubmit,
  onSuccess,
  onError,
}: AddTransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [concepto, setConcepto] = useState("");
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState(todayStr());
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [cliente, setCliente] = useState("");
  const [esFiado, setEsFiado] = useState(false);
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  const isIngreso = tipo === "ingreso";

  function resetForm() {
    setConcepto("");
    setNota("");
    setCliente("");
    setValor("");
    setEsFiado(false);
  }

  async function handleSave() {
    if (!concepto.trim()) return onError();
    const numValor = parseFloat(valor);
    if (!numValor || numValor <= 0) return onError();
    if (!fecha) return onError();

    setSaving(true);
    const { error } = await onSubmit({
      tipo,
      concepto: concepto.trim(),
      valor: numValor,
      nota: nota.trim() || null,
      fecha,
      medio_pago: medioPago,
      cliente: cliente.trim() || null,
      es_fiado: isIngreso ? esFiado : false,
    });
    setSaving(false);

    if (error) {
      onError();
      return;
    }

    resetForm();
    onSuccess(tipo);
  }

  return (
    <div className="border-t mt-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3.5 px-5.5 py-4 hover:bg-secondary transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8.5 h-8.5 rounded-[10px] bg-accent text-accent-foreground shrink-0">
          <Plus className="size-4" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-display text-[0.875rem]">
            Nuevo movimiento
          </span>
          <span className="text-[0.78rem] text-muted-foreground">
            Registra un ingreso o un gasto
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5.5 pb-5 pt-1 flex flex-col gap-3">
              {/* Type toggle */}
              <div className="flex gap-0.5 bg-secondary rounded-[11px] p-0.5">
                <button
                  onClick={() => setTipo("ingreso")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.78rem] font-bold transition-colors",
                    isIngreso
                      ? "bg-success/10 text-success shadow-[0_0_12px_var(--success)_inset]/30"
                      : "text-muted-foreground"
                  )}
                >
                  <ArrowDownLeft className="size-3" />
                  Ingreso
                </button>
                <button
                  onClick={() => setTipo("gasto")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.78rem] font-bold transition-colors",
                    !isIngreso
                      ? "bg-destructive/10 text-destructive shadow-[0_0_12px_var(--destructive)_inset]/30"
                      : "text-muted-foreground"
                  )}
                >
                  <ArrowUpRight className="size-3" />
                  Egreso
                </button>
              </div>

              {/* Concepto */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {isIngreso ? "¿Qué ingresó?" : "¿En qué se gastó?"}
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder={
                      isIngreso
                        ? "Ej: Servicio de consultoría"
                        : "Ej: Insumos de producción"
                    }
                  />
                </div>
              </div>

              {/* Nota + Fecha */}
              <div className="flex gap-2.5">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Nota{" "}
                    <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                      opcional
                    </span>
                  </Label>
                  <div className="relative">
                    <PencilLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-9"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Detalle adicional"
                    />
                  </div>
                </div>
                <div className="w-32 shrink-0 flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Medio pago + Cliente */}
              <div className="flex gap-2.5">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Medio de pago
                  </Label>
                  <Select
                    value={medioPago}
                    onValueChange={(v) => setMedioPago(v as MedioPago)}
                  >
                    <SelectTrigger className="w-full">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">
                        Transferencia
                      </SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 shrink-0 flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Cliente{" "}
                    <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                      opcional
                    </span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-9"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Nombre"
                    />
                  </div>
                </div>
              </div>

              {/* Fiado toggle (only for ingreso) */}
              {isIngreso && (
                <button
                  type="button"
                  onClick={() => setEsFiado((f) => !f)}
                  className={cn(
                    "flex items-center gap-2.5 w-full bg-secondary border rounded-xl px-3.5 py-2.5 text-left transition-colors",
                    esFiado && "border-warning/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-[18px] h-[18px] rounded-md border-[1.5px] border-muted-foreground shrink-0",
                      esFiado &&
                        "bg-warning border-warning text-warning-foreground shadow-[0_0_10px_var(--warning)]/40"
                    )}
                  >
                    {esFiado && <Check className="size-3" />}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
                      esFiado && "text-foreground"
                    )}
                  >
                    <Clock3 className="size-3.5 text-warning" />
                    Es fiado / queda debiendo
                  </span>
                </button>
              )}

              {/* Valor + Save */}
              <div className="flex gap-2.5 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valor
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      className="pl-7 font-bold text-base"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9.5 gap-1.5 shrink-0 shadow-lg glow-primary"
                >
                  <Check className="size-4" />
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
