"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Cliente,
  NuevoCliente,
  AnotacionServicio,
  NuevaAnotacion,
  NuevoRecordatorio,
  RecordatorioConCliente,
} from "@/lib/types-clientes";

const PREFIJO_CO = "57";

export function formatearTelefono(diez_digitos: string): string {
  const limpio = diez_digitos.replace(/\D/g, "");
  if (limpio.startsWith("57") && limpio.length === 12) return limpio;
  return `${PREFIJO_CO}${limpio}`;
}

// ════════════════════════════════════════
// HOOK CLIENTES
// ════════════════════════════════════════
export function useClientes(userId: string | undefined) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Clear state when user logs out — separate effect so the linter
  // only sees one setState call per effect body (same fix as use-movimientos).
  useEffect(() => {
    if (userId) return;
    setClientes([]);
    setLoading(false);
  }, [userId]);

  // Fetch from Supabase (external system) when userId is available.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .order("nombre", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setClientes(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const addCliente = useCallback(
    async (nuevo: NuevoCliente) => {
      if (!userId) return { error: new Error("Sin sesión"), data: null };
      const { data, error } = await supabase
        .from("clientes")
        .insert({ ...nuevo, telefono: formatearTelefono(nuevo.telefono), user_id: userId })
        .select()
        .single();
      if (!error && data)
        setClientes((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return { error, data };
    },
    [userId]
  );

  const updateCliente = useCallback(
    async (id: string, cambios: Partial<NuevoCliente>) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const payload = cambios.telefono
        ? { ...cambios, telefono: formatearTelefono(cambios.telefono) }
        : cambios;
      const { error } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId);
      if (!error)
        setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
      return { error };
    },
    [userId]
  );

  const deleteCliente = useCallback(
    async (id: string) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) setClientes((prev) => prev.filter((c) => c.id !== id));
      return { error };
    },
    [userId]
  );

  return { clientes, loading, addCliente, updateCliente, deleteCliente };
}

// ════════════════════════════════════════
// HOOK ANOTACIONES
// ════════════════════════════════════════
export function useAnotaciones(
  clienteId: string | undefined,
  userId: string | undefined
) {
  const [anotaciones, setAnotaciones] = useState<AnotacionServicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clienteId && userId) return;
    setAnotaciones([]);
    setLoading(false);
  }, [clienteId, userId]);

  useEffect(() => {
    if (!clienteId || !userId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("anotaciones_servicio")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("user_id", userId)
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setAnotaciones(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clienteId, userId]);

  const addAnotacion = useCallback(
    async (nueva: NuevaAnotacion) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { data, error } = await supabase
        .from("anotaciones_servicio")
        .insert({ ...nueva, user_id: userId })
        .select()
        .single();
      if (!error && data) setAnotaciones((prev) => [data, ...prev]);
      return { error, data };
    },
    [userId]
  );

  const deleteAnotacion = useCallback(
    async (id: string) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { error } = await supabase
        .from("anotaciones_servicio")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) setAnotaciones((prev) => prev.filter((a) => a.id !== id));
      return { error };
    },
    [userId]
  );

  return { anotaciones, loading, addAnotacion, deleteAnotacion };
}

// ════════════════════════════════════════
// HOOK RECORDATORIOS
// ════════════════════════════════════════
export function useRecordatorios(userId: string | undefined) {
  const [recordatorios, setRecordatorios] = useState<RecordatorioConCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) return;
    setRecordatorios([]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("recordatorios")
      .select("*, clientes(nombre, telefono)")
      .eq("user_id", userId)
      .order("fecha_envio", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setRecordatorios((data as RecordatorioConCliente[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const addRecordatorio = useCallback(
    async (nuevo: NuevoRecordatorio) => {
      if (!userId) return { error: new Error("Sin sesión"), data: null };
      const { data, error } = await supabase
        .from("recordatorios")
        .insert({ ...nuevo, user_id: userId })
        .select("*, clientes(nombre, telefono)")
        .single();
      if (!error && data) {
        setRecordatorios((prev) =>
          [...prev, data as RecordatorioConCliente].sort(
            (a, b) => new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime()
          )
        );
      }
      return { error, data };
    },
    [userId]
  );

  const deleteRecordatorio = useCallback(
    async (id: string) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { error } = await supabase
        .from("recordatorios")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) setRecordatorios((prev) => prev.filter((r) => r.id !== id));
      return { error };
    },
    [userId]
  );

  const enviarAhora = useCallback(
    async (recordatorio: RecordatorioConCliente, nombreNegocio: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return { error: "Sin sesión" };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            recordatorio_id: recordatorio.id,
            telefono: recordatorio.clientes.telefono,
            nombre_cliente: recordatorio.clientes.nombre,
            nombre_negocio: nombreNegocio,
            motivo: recordatorio.motivo,
          }),
        }
      );

      const json = await res.json();
      if (json.ok) {
        setRecordatorios((prev) =>
          prev.map((r) =>
            r.id === recordatorio.id
              ? { ...r, enviado: true, enviado_at: new Date().toISOString() }
              : r
          )
        );
      }
      return json;
    },
    []
  );

  return { recordatorios, loading, addRecordatorio, deleteRecordatorio, enviarAhora };
}
