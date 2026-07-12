"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Perfil } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPerfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setPerfil(data ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadPerfil(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadPerfil(session.user.id);
        else setPerfil(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [loadPerfil]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, nombreNegocio: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };
      if (data.user) {
        await supabase.from("perfiles").insert({
          user_id: data.user.id,
          nombre_negocio: nombreNegocio,
          email,
        });
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateNombreNegocio = useCallback(
    async (nuevoNombre: string) => {
      if (!user) return { error: new Error("Sin sesión") };
      const { error } = await supabase
        .from("perfiles")
        .update({ nombre_negocio: nuevoNombre })
        .eq("user_id", user.id);

      // KEY FIX: update local state immediately so page.tsx re-renders
      // with the new name without waiting for a full page reload.
      if (!error) {
        setPerfil((prev) =>
          prev ? { ...prev, nombre_negocio: nuevoNombre } : prev
        );
      }

      return { error };
    },
    [user]
  );

  return {
    user,
    perfil,
    loading,
    signIn,
    signUp,
    signOut,
    updateNombreNegocio,
  };
}
