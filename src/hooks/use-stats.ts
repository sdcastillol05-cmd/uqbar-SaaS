"use client";

import { useMemo } from "react";
import type { Movimiento } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function weekStartStr() {
  const now = new Date();
  const day = now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split("T")[0];
}
function monthStartStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export interface Stats {
  hoy: number;
  semana: number;
  mes: number;
  gastosMes: number;
  fiadoTotal: number;
  balanceMes: number;
  balanceHistorico: number;
  margen: number | null;
  totalMovimientos: number;
  chartData: { day: string; ingresos: number; egresos: number }[];
  weekIncomeTotal: number;
  weekExpenseTotal: number;
}

export function useStats(movimientos: Movimiento[]): Stats {
  return useMemo(() => {
    const today = todayStr();
    const weekStart = weekStartStr();
    const monthStart = monthStartStr();

    let hoy = 0,
      semana = 0,
      mes = 0,
      gastosMes = 0,
      fiadoTotal = 0,
      totalIngHist = 0,
      totalGastoHist = 0;

    movimientos.forEach((m) => {
      const val = Number(m.valor);
      if (m.tipo === "ingreso") {
        if (m.fecha === today) hoy += val;
        if (m.fecha >= weekStart) semana += val;
        if (m.fecha >= monthStart) mes += val;
        if (m.es_fiado) fiadoTotal += val;
        totalIngHist += val;
      } else {
        if (m.fecha >= monthStart) gastosMes += val;
        totalGastoHist += val;
      }
    });

    const balanceMes = mes - gastosMes;
    const balanceHistorico = totalIngHist - totalGastoHist;
    const margen = mes > 0 ? Math.round((balanceMes / mes) * 100) : null;

    // Last 7 days chart data
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    const chartData = days.map((d) => {
      const dayLabel = new Date(d + "T12:00:00").toLocaleDateString("es-CO", {
        weekday: "short",
      });
      const ingresos = movimientos
        .filter((m) => m.tipo === "ingreso" && m.fecha === d)
        .reduce((s, m) => s + Number(m.valor), 0);
      const egresos = movimientos
        .filter((m) => m.tipo === "gasto" && m.fecha === d)
        .reduce((s, m) => s + Number(m.valor), 0);
      return { day: dayLabel, ingresos, egresos };
    });

    const sevenDaysAgo = days[0];
    const weekIncomeTotal = movimientos
      .filter((m) => m.tipo === "ingreso" && m.fecha >= sevenDaysAgo)
      .reduce((s, m) => s + Number(m.valor), 0);
    const weekExpenseTotal = movimientos
      .filter((m) => m.tipo === "gasto" && m.fecha >= sevenDaysAgo)
      .reduce((s, m) => s + Number(m.valor), 0);

    return {
      hoy,
      semana,
      mes,
      gastosMes,
      fiadoTotal,
      balanceMes,
      balanceHistorico,
      margen,
      totalMovimientos: movimientos.length,
      chartData,
      weekIncomeTotal,
      weekExpenseTotal,
    };
  }, [movimientos]);
}
