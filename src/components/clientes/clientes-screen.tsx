"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Plus, Search, Phone, ChevronRight,
  Calendar, Clock, CheckCircle2, AlertCircle,
  Send, Trash2, PencilLine, X, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  useClientes,
  useAnotaciones,
  useRecordatorios,
} from "@/hooks/use-clientes";
import { CalendarioRecordatorios } from "@/components/calendario/calendario-recordatorios";
import type { Cliente, RecordatorioConCliente } from "@/lib/types-clientes";
import { cn } from "@/lib/utils";

const TODAY = new Date().toISOString().split("T")[0];

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

interface ClientesScreenProps {
  userId: string;
  nombreNegocio: string;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function ClientesScreen({
  userId,
  nombreNegocio,
  showToast,
}: ClientesScreenProps) {
  const { clientes, loading: loadingC, addCliente, deleteCliente } = useClientes(userId);
  const { recordatorios, addRecordatorio, deleteRecordatorio, enviarAhora } =
    useRecordatorios(userId);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [showFormCliente, setShowFormCliente] = useState(false);
  const [showFormRecordatorio, setShowFormRecordatorio] = useState(false);

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono.includes(search)
  );

  // Recordatorios del cliente seleccionado
  const recsDel = selected
    ? recordatorios.filter((r) => r.cliente_id === selected.id)
    : [];

  return (
    <div className="max-w-[1320px] mx-auto px-8 pb-8">
      <header className="relative py-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display text-[1.85rem] mb-1.5"
        >
          Clientes
        </motion.h1>
        <p className="text-[0.92rem] text-muted-foreground">
          Directorio, historial de servicios y recordatorios por WhatsApp.
        </p>
        <div className="absolute -bottom-1 left-0 w-40 h-px bg-gradient-to-r from-primary via-[#00bbff] to-transparent opacity-50" />
      </header>

      {/* 3-column layout on large screens: list | detail | calendar
          The calendar column is hidden on mobile (hidden lg:block) so it
          never breaks the mobile view. */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_260px] gap-4 items-start">

        {/* ── LISTA DE CLIENTES ── */}
        <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
          <div className="flex items-center gap-3 px-5 py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              size="icon"
              onClick={() => setShowFormCliente(true)}
              className="size-9 shrink-0 glow-primary"
              title="Agregar cliente"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <ScrollArea className="h-[520px]">
            {loadingC ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary border flex items-center justify-center text-muted-foreground">
                  <Users className="size-5" />
                </div>
                <p className="font-bold text-sm">
                  {search ? "Sin resultados" : "Aún no hay clientes"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? "Prueba con otro nombre o número"
                    : 'Agrega el primero con el botón "+"'}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtrados.map((c) => {
                  const recsC = recordatorios.filter(
                    (r) => r.cliente_id === c.id && !r.enviado
                  );
                  return (
                    <motion.button
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => setSelected(c)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3.5 border-b text-left transition-colors",
                        selected?.id === c.id
                          ? "bg-accent"
                          : "hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#9163ff] to-primary text-white text-display text-sm shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="size-3" />
                          {c.telefono}
                        </p>
                      </div>
                      {recsC.length > 0 && (
                        <Badge className="bg-warning/10 text-warning border-0 text-[0.65rem]">
                          {recsC.length} rec.
                        </Badge>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </ScrollArea>
        </Card>

        {/* ── DETALLE DEL CLIENTE ── */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <ClienteDetalle
                cliente={selected}
                userId={userId}
                nombreNegocio={nombreNegocio}
                recordatorios={recsDel}
                onAddRecordatorio={() => setShowFormRecordatorio(true)}
                onDeleteRecordatorio={async (id) => {
                  const { error } = await deleteRecordatorio(id);
                  if (error) showToast("No se pudo eliminar.", "error");
                  else showToast("Recordatorio eliminado");
                }}
                onEnviarAhora={async (rec) => {
                  const res = await enviarAhora(rec, nombreNegocio);
                  if (res.ok) showToast("¡Mensaje enviado por WhatsApp!", "success");
                  else showToast("No se pudo enviar. Revisa que la plantilla esté aprobada.", "error");
                }}
                onDelete={async () => {
                  const { error } = await deleteCliente(selected.id);
                  if (error) showToast("No se pudo eliminar.", "error");
                  else { showToast("Cliente eliminado"); setSelected(null); }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary border flex items-center justify-center text-muted-foreground">
                <Users className="size-6" />
              </div>
              <p className="font-bold text-sm">Selecciona un cliente</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Haz clic en cualquier cliente de la lista para ver su perfil,
                historial y recordatorios.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CALENDARIO — solo desktop, oculto en móvil ── */}
        <div className="hidden lg:flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-display text-sm">Recordatorios</span>
          </div>
          <CalendarioRecordatorios recordatorios={recordatorios} />
        </div>
      </div>

      {/* ── MODAL NUEVO CLIENTE ── */}
      <AnimatePresence>
        {showFormCliente && (
          <FormModal
            title="Nuevo cliente"
            onClose={() => setShowFormCliente(false)}
          >
            <FormNuevoCliente
              onSubmit={async (data) => {
                const { error } = await addCliente(data);
                if (error) showToast("No se pudo guardar.", "error");
                else { showToast("Cliente agregado", "success"); setShowFormCliente(false); }
              }}
              onCancel={() => setShowFormCliente(false)}
            />
          </FormModal>
        )}
      </AnimatePresence>

      {/* ── MODAL NUEVO RECORDATORIO ── */}
      <AnimatePresence>
        {showFormRecordatorio && selected && (
          <FormModal
            title={`Recordatorio para ${selected.nombre}`}
            onClose={() => setShowFormRecordatorio(false)}
          >
            <FormNuevoRecordatorio
              clienteNombre={selected.nombre}
              nombreNegocio={nombreNegocio}
              onSubmit={async (data) => {
                const { error } = await addRecordatorio({
                  cliente_id: selected.id,
                  ...data,
                });
                if (error) showToast("No se pudo guardar.", "error");
                else {
                  showToast("Recordatorio programado ✓", "success");
                  setShowFormRecordatorio(false);
                }
              }}
              onCancel={() => setShowFormRecordatorio(false)}
            />
          </FormModal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════
// DETALLE DEL CLIENTE
// ════════════════════════════════════════
function ClienteDetalle({
  cliente,
  userId,
  nombreNegocio,
  recordatorios,
  onAddRecordatorio,
  onDeleteRecordatorio,
  onEnviarAhora,
  onDelete,
}: {
  cliente: Cliente;
  userId: string;
  nombreNegocio: string;
  recordatorios: RecordatorioConCliente[];
  onAddRecordatorio: () => void;
  onDeleteRecordatorio: (id: string) => void;
  onEnviarAhora: (r: RecordatorioConCliente) => void;
  onDelete: () => void;
}) {
  const { anotaciones, addAnotacion, deleteAnotacion } = useAnotaciones(
    cliente.id,
    userId
  );
  const [notaInput, setNotaInput] = useState("");
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  async function handleAddNota() {
    if (!notaInput.trim()) return;
    await addAnotacion({
      cliente_id: cliente.id,
      descripcion: notaInput.trim(),
      fecha: TODAY,
    });
    setNotaInput("");
  }

  return (
    <>
      {/* Header del cliente */}
      <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9163ff] to-primary text-white text-display text-2xl shrink-0 shadow-[0_4px_20px_color-mix(in_srgb,var(--primary)_40%,transparent)]">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-display text-xl mb-0.5">{cliente.nombre}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {cliente.telefono}
            </p>
            {cliente.notas && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                {cliente.notas}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="size-8 text-muted-foreground hover:text-destructive hover:border-destructive shrink-0"
            title="Eliminar cliente"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {cliente.ultimo_servicio && (
          <>
            <Separator />
            <div className="px-6 py-3 flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Último servicio:</span>
              <span className="font-medium">{cliente.ultimo_servicio}</span>
              {cliente.ultima_visita && (
                <span className="text-muted-foreground text-xs ml-1">
                  ({fmtFecha(cliente.ultima_visita)})
                </span>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Recordatorios */}
      <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Calendar className="size-3.5 text-accent-foreground" />
            </div>
            <span className="text-display text-sm">Recordatorios WhatsApp</span>
          </div>
          <Button size="sm" onClick={onAddRecordatorio} className="gap-1.5 glow-primary h-8">
            <Plus className="size-3.5" />
            Programar
          </Button>
        </div>

        <div className="divide-y">
          {recordatorios.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Sin recordatorios programados para este cliente.
            </div>
          ) : (
            recordatorios.map((r) => {
              const yaEnviado  = r.enviado;
              const yaVencio   = new Date(r.fecha_envio) <= new Date();
              const pendiente  = !yaEnviado && !r.error;

              return (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    yaEnviado ? "bg-success/10 text-success" :
                    r.error   ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  )}>
                    {yaEnviado ? <CheckCircle2 className="size-3.5" /> :
                     r.error   ? <AlertCircle  className="size-3.5" /> :
                                 <Clock        className="size-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{r.motivo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {yaEnviado
                        ? `Enviado ${fmtFechaHora(r.enviado_at!)}`
                        : `Programado: ${fmtFechaHora(r.fecha_envio)}`}
                    </p>
                    {r.error && (
                      <p className="text-xs text-destructive mt-0.5">{r.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!yaEnviado && yaVencio && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={enviandoId === r.id}
                        onClick={async () => {
                          setEnviandoId(r.id);
                          await onEnviarAhora(r);
                          setEnviandoId(null);
                        }}
                      >
                        <Send className="size-3" />
                        {enviandoId === r.id ? "Enviando…" : "Enviar ahora"}
                      </Button>
                    )}
                    {!yaEnviado && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteRecordatorio(r.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Historial de servicios / anotaciones */}
      <Card className="p-0 gap-0 overflow-hidden border-card-foreground/5">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <PencilLine className="size-3.5 text-accent-foreground" />
          </div>
          <span className="text-display text-sm">Historial de servicios</span>
        </div>

        {/* Input para agregar nota */}
        <div className="flex gap-2.5 px-5 py-3.5 border-b">
          <Input
            placeholder="Ej: Cambio de aceite + filtros, corte de cabello..."
            value={notaInput}
            onChange={(e) => setNotaInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddNota(); }}
            className="flex-1"
          />
          <Button
            onClick={handleAddNota}
            disabled={!notaInput.trim()}
            size="sm"
            className="shrink-0 glow-primary"
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>

        <ScrollArea className="h-[240px]">
          {anotaciones.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Aún no hay anotaciones para este cliente.
            </div>
          ) : (
            anotaciones.map((a) => (
              <div
                key={a.id}
                className="group flex items-start gap-3 px-5 py-3 border-b last:border-0 hover:bg-secondary"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtFecha(a.fecha)}
                  </p>
                </div>
                <button
                  onClick={() => deleteAnotacion(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>
      </Card>
    </>
  );
}

// ════════════════════════════════════════
// MODAL WRAPPER
// ════════════════════════════════════════
function FormModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-card border border-card-foreground/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-display text-base">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════
// FORM NUEVO CLIENTE
// ════════════════════════════════════════
function FormNuevoCliente({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { nombre: string; telefono: string; notas: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [nombre, setNombre]   = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas]     = useState("");
  const [saving, setSaving]   = useState(false);

  async function handle() {
    if (!nombre.trim() || !telefono.trim()) return;
    setSaving(true);
    await onSubmit({ nombre: nombre.trim(), telefono: telefono.trim(), notas: notas.trim() });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Nombre completo
        </Label>
        <Input placeholder="Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          WhatsApp (10 dígitos)
        </Label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 rounded-md border bg-secondary text-sm text-muted-foreground shrink-0">
            🇨🇴 +57
          </span>
          <Input
            placeholder="3001234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Solo los 10 dígitos, sin el 0 inicial. Ej: 3001234567
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Notas generales <span className="normal-case font-normal tracking-normal">opcional</span>
        </Label>
        <Input
          placeholder="Ej: Cliente frecuente, alergia a X..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>
      <div className="flex gap-2.5 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handle}
          disabled={!nombre.trim() || !telefono.trim() || saving}
          className="flex-1 glow-primary"
        >
          {saving ? "Guardando…" : "Agregar cliente"}
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// FORM NUEVO RECORDATORIO
// ════════════════════════════════════════
function FormNuevoRecordatorio({
  clienteNombre,
  nombreNegocio,
  onSubmit,
  onCancel,
}: {
  clienteNombre: string;
  nombreNegocio: string;
  onSubmit: (data: { motivo: string; fecha_envio: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha]   = useState(TODAY);
  const [hora, setHora]     = useState("09:00");
  const [saving, setSaving] = useState(false);

  async function handle() {
    if (!motivo.trim() || !fecha || !hora) return;
    // Convertir fecha + hora local (Colombia UTC-5) a ISO UTC
    const localStr = `${fecha}T${hora}:00`;
    const fechaUTC = new Date(localStr).toISOString();
    setSaving(true);
    await onSubmit({ motivo: motivo.trim(), fecha_envio: fechaUTC });
    setSaving(false);
  }

  // Preview del mensaje que recibirá el cliente — usa el nombre real del negocio
  const preview = motivo.trim()
    ? `Hola ${clienteNombre}, te escribe ${nombreNegocio}.\n\nTe recordamos que tienes pendiente: ${motivo}.\n\nEste es un mensaje automático. Para confirmar o reagendar, comunícate directamente con nosotros. ¡Te esperamos pronto!`
    : "";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          ¿Qué le recuerdas?
        </Label>
        <Input
          placeholder="Ej: revisión de tu vehículo, tu próxima cita..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1 flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Fecha de envío
          </Label>
          <Input
            type="date"
            value={fecha}
            min={TODAY}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="w-28 flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Hora
          </Label>
          <Input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </div>
      </div>

      {/* Preview del mensaje */}
      {preview && (
        <div className="bg-secondary border rounded-xl p-3.5">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Vista previa del mensaje
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
            {preview}
          </p>
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handle}
          disabled={!motivo.trim() || !fecha || !hora || saving}
          className="flex-1 glow-primary"
        >
          {saving ? "Guardando…" : "Programar recordatorio"}
        </Button>
      </div>
    </div>
  );
}
