"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AI_ADVICE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-advice`;
const AI_CACHE_HOURS = 6;

const AI_INTRO_PATTERNS = [
  /^aqu[ií]\s+(tienes|est[aá]n|van)/i,
  /^claro[,.]?/i,
  /^estos?\s+son/i,
  /^te\s+(comparto|dejo|doy)/i,
  /^basad[oa]\s+en/i,
  /^con\s+gusto/i,
  /^perfecto[,.]?/i,
  /^espero\s+que/i,
  /^¡?listo[,!.]?/i,
];

function parseAdviceLines(text: string): string[] {
  let raw = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (raw.length <= 1 && raw[0]) {
    const split = raw[0]
      .split(/(?=\d+\.\s)/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (split.length > 1) raw = split;
  }

  const cleaned = raw.map((l) =>
    l.replace(/^(\d+[.)]\s*|[-•]\s*)/, "").trim()
  );

  return cleaned.filter(
    (l) => l && l.length >= 8 && !AI_INTRO_PATTERNS.some((rx) => rx.test(l))
  );
}

function cacheKey(userId: string) {
  return `uq-ai-advice-cache-${userId}`;
}

export function useAIAdvice(userId: string | undefined) {
  const [advice, setAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!userId) return;

      if (!forceRefresh) {
        try {
          const raw = localStorage.getItem(cacheKey(userId));
          if (raw) {
            const parsed = JSON.parse(raw);
            const ageHours = (Date.now() - parsed.timestamp) / 36e5;
            if (ageHours <= AI_CACHE_HOURS) {
              setAdvice(parseAdviceLines(parsed.advice));
              return;
            }
          }
        } catch {
          // ignore cache errors
        }
      }

      setLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) throw new Error("Sin sesión activa");

        const res = await fetch(AI_ADVICE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Error al generar consejos");
        }

        const lines = parseAdviceLines(json.advice);
        setAdvice(lines);

        try {
          localStorage.setItem(
            cacheKey(userId),
            JSON.stringify({ advice: json.advice, timestamp: Date.now() })
          );
        } catch {
          // ignore storage errors
        }
      } catch {
        setError(
          "No se pudo conectar con el asistente de IA. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return { advice, loading, error, load };
}
