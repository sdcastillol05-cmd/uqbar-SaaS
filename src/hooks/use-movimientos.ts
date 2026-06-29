"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Movimiento, NuevoMovimiento } from "@/lib/types";

export function useMovimientos(userId: string | undefined) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetches movimientos from Supabase (an external system) and syncs
  // local state with the result — the canonical use-case for useEffect.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    supabase
      .from("movimientos")
      .select("*")
      .eq("user_id", userId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setMovimientos(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  // Clears local state when the user logs out (userId becomes undefined).
  // This is a separate, trivial effect so the lint rule only needs to
  // reason about one setState call per effect body.
  useEffect(() => {
    if (userId) return;
    setMovimientos([]);
    setLoading(false);
  }, [userId]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const addMovimiento = useCallback(
    async (nuevo: NuevoMovimiento) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { data, error } = await supabase
        .from("movimientos")
        .insert({ ...nuevo, user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setMovimientos((prev) => [data, ...prev]);
      }
      return { error, data };
    },
    [userId]
  );

  const deleteMovimiento = useCallback(
    async (id: string) => {
      if (!userId) return { error: new Error("Sin sesión") };
      const { error } = await supabase
        .from("movimientos")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) {
        setMovimientos((prev) => prev.filter((m) => m.id !== id));
      }
      return { error };
    },
    [userId]
  );

  return { movimientos, loading, addMovimiento, deleteMovimiento, reload };
}
