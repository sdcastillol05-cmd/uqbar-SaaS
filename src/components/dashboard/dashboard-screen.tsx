"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  CalendarDays,
  CalendarRange,
  TrendingUp,
  Banknote,
  Hash,
  PiggyBank,
} from "lucide-react";

import { Navbar } from "@/components/dashboard/navbar";
import { AmbientBackground } from "@/components/dashboard/ambient-background";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import { AIAdvisorPanel } from "@/components/dashboard/ai-advisor-panel";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { Card } from "@/components/ui/card";

import { useAuth } from "@/hooks/use-auth";
import { useMovimientos } from "@/hooks/use-movimientos";
import { useStats } from "@/hooks/use-stats";
import { useAIAdvice } from "@/hooks/use-ai-advice";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { fmtCOP } from "@/lib/format";
import type { TipoMovimiento } from "@/lib/types";

export function DashboardScreen() {
  const { user, perfil, signOut, updateNombreNegocio } = useAuth();
  const { movimientos, addMovimiento, deleteMovimiento } = useMovimientos(
    user?.id
  );
  const stats = useStats(movimientos);
  const { advice, loading: aiLoading, error: aiError, load: loadAdvice } =
    useAIAdvice(user?.id);
  const { theme, toggleTheme } = useTheme();
  const { showToast, ToastPortal } = useToast();

  const businessName = perfil?.nombre_negocio || "Mi negocio";

  useEffect(() => {
    if (user?.id) loadAdvice(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleRename(newName: string) {
    const { error } = await updateNombreNegocio(newName);
    showToast(
      error ? "No se pudo guardar el nombre." : "Nombre actualizado",
      error ? "error" : "success"
    );
  }

  function handleTxSuccess(tipo: TipoMovimiento) {
    showToast(
      tipo === "ingreso" ? "Ingreso registrado" : "Egreso registrado",
      "success"
    );
  }

  function handleTxError() {
    showToast("Revisa los datos del movimiento.", "error");
  }

  async function handleDelete(id: string) {
    const { error } = await deleteMovimiento(id);
    if (error) showToast("No se pudo eliminar.", "error");
  }

  const healthLabel =
    stats.margen === null
      ? "Sin datos"
      : stats.margen >= 30
      ? "Saludable"
      : stats.margen >= 10
      ? "Estable"
      : "Ajustado";

  return (
    <div className="min-h-screen flex flex-col relative">
      <AmbientBackground />

      <Navbar
        businessName={businessName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={signOut}
        onRenameBusiness={handleRename}
      />

      <div className="max-w-[1320px] w-full mx-auto px-8 pb-8 flex-1">
        <header className="relative py-8">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-display text-[1.85rem] mb-1.5 bg-gradient-to-r from-foreground via-foreground to-accent-foreground bg-clip-text"
          >
            {businessName} · Resumen
          </motion.h1>
          <p className="text-[0.92rem] text-muted-foreground">
            Tu pulso financiero en tiempo real — ingresos, gastos y qué
            hacer después.
          </p>
          {/* Decorative gradient hairline under the header, echoes the KPI card accents */}
          <div className="absolute -bottom-1 left-0 w-40 h-px bg-gradient-to-r from-primary via-[#00bbff] to-transparent opacity-50" />
        </header>

        {/* KPI grid — 4 + 3 layout like the mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <KpiCard
            icon={Wallet}
            color="#00BBFF"
            label="Balance neto"
            value={fmtCOP(stats.balanceHistorico)}
            sub="Ingresos menos gastos, histórico"
            badge={{
              label:
                stats.margen !== null ? `${stats.margen}% margen` : "Sin datos",
              icon: TrendingUp,
            }}
            delay={0}
          />
          <KpiCard
            icon={CalendarDays}
            color="#FF5CA8"
            label="Ingresos de hoy"
            value={fmtCOP(stats.hoy)}
            sub="Registrado hoy"
            delay={0.04}
          />
          <KpiCard
            icon={CalendarRange}
            color="#FFB020"
            label="Ingresos semana"
            value={fmtCOP(stats.semana)}
            sub="Últimos 7 días"
            delay={0.08}
          />
          <KpiCard
            icon={TrendingUp}
            color="#7C5CFC"
            label="Ingresos del mes"
            value={fmtCOP(stats.mes)}
            sub="Mes calendario actual"
            delay={0.12}
          />
          <KpiCard
            icon={Banknote}
            color="#FF6B5C"
            label="Gastos del mes"
            value={fmtCOP(stats.gastosMes)}
            sub="Mes calendario actual"
            delay={0.16}
          />
          <KpiCard
            icon={Hash}
            color="#22D3C5"
            label="Movimientos"
            value={String(stats.totalMovimientos)}
            sub="Total registrados"
            delay={0.2}
          />
          <KpiCard
            icon={PiggyBank}
            color="#00E0A4"
            label="Margen del mes"
            value={stats.margen !== null ? `${stats.margen}%` : "—"}
            sub="Neto sobre ingreso bruto"
            badge={{ label: healthLabel, icon: TrendingUp }}
            delay={0.24}
          />
        </div>

        {/* Bottom grid — Cash flow + transactions | AI advisor + add form */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          <Card className="relative p-0 gap-0 overflow-hidden border-card-foreground/5">
            <div
              className="pointer-events-none absolute -top-32 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]"
              style={{
                background: "radial-gradient(circle, var(--primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 flex items-center justify-between gap-3.5 px-5.5 pt-5 pb-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-display text-[1rem]">Flujo de caja</span>
                <span className="text-[0.78rem] text-muted-foreground">
                  Ingresos vs. gastos, últimos 7 días
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                  Ingresos{" "}
                  <strong className="text-foreground font-bold">
                    {fmtCOP(stats.weekIncomeTotal)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--chart-2)] shadow-[0_0_8px_var(--chart-2)]" />
                  Gastos{" "}
                  <strong className="text-foreground font-bold">
                    {fmtCOP(stats.weekExpenseTotal)}
                  </strong>
                </span>
              </div>
            </div>
            <div className="relative z-10 px-5.5 pb-4">
              <CashFlowChart data={stats.chartData} />
            </div>

            <div className="relative z-10">
              <TransactionsList
                movimientos={movimientos}
                onDelete={handleDelete}
              />
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <AIAdvisorPanel
              advice={advice}
              loading={aiLoading}
              error={aiError}
              onRefresh={() => loadAdvice(true)}
            />
            <Card className="relative p-0 gap-0 overflow-hidden border-card-foreground/5">
              <div
                className="pointer-events-none absolute -bottom-20 -right-16 w-56 h-56 rounded-full blur-3xl opacity-[0.1]"
                style={{
                  background: "radial-gradient(circle, #00e0a4, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <AddTransactionForm
                  onSubmit={addMovimiento}
                  onSuccess={handleTxSuccess}
                  onError={handleTxError}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-2 py-5 text-xs text-muted-foreground border-t">
        <span>
          por <strong>Uqbar</strong>
        </span>
        <span className="text-border">·</span>
        <a href="https://uqbar.app" target="_blank" rel="noreferrer" className="hover:underline">
          uqbar.app
        </a>
      </footer>

      <ToastPortal />
    </div>
  );
}
