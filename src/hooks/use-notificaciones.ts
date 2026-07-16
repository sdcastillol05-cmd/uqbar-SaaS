"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Notificacion {
  id: string;
  tipo: "ia" | "sistema" | "recordatorio";
  titulo: string;
  mensaje: string;
  leida: boolean;
  metadata?: Record<string, string> | null;
  created_at: string;
}

export function useNotificaciones(userId: string | undefined) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Clear when logged out
  useEffect(() => {
    if (userId) return;
    setNotificaciones([]);
    setLoading(false);
  }, [userId]);

  // Fetch unread notifications
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("notificaciones")
      .select("*")
      .eq("user_id", userId)
      .eq("leida", false)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return;
        setNotificaciones((data as Notificacion[]) ?? []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const descartar = useCallback(async (id: string) => {
    // Optimistic update — remove immediately from UI
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    // Mark as read in Supabase
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id);
  }, []);

  const descartarTodas = useCallback(async () => {
    if (!userId) return;
    const ids = notificaciones.map((n) => n.id);
    setNotificaciones([]);
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .in("id", ids);
  }, [userId, notificaciones]);

  // Allow other parts of the app to push a local notification
  // (e.g. after the AI analysis runs)
  const pushLocal = useCallback((n: Omit<Notificacion, "id" | "leida" | "created_at">) => {
    setNotificaciones((prev) => [
      {
        ...n,
        id: crypto.randomUUID(),
        leida: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  return {
    notificaciones,
    loading,
    count: notificaciones.length,
    descartar,
    descartarTodas,
    pushLocal,
  };
}
