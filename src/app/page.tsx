"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { ClientesScreen } from "@/components/clientes/clientes-screen";
import { ReseñasScreen } from "@/components/reseñas/reseñas-screen";
import { Navbar } from "@/components/dashboard/navbar";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useNotificaciones } from "@/hooks/use-notificaciones";
import { LayoutDashboard, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "clientes" | "reseñas";

export default function Home() {
  const { user, perfil, loading, signOut, updateNombreNegocio } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast, ToastPortal } = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");

  const {
    notificaciones,
    count: notifCount,
    descartar,
    descartarTodas,
  } = useNotificaciones(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const businessName = perfil?.nombre_negocio || "Mi negocio";
  const showOnboarding = perfil !== null && !perfil?.onboarding_completado;

  async function handleRename(newName: string) {
    const { error } = await updateNombreNegocio(newName);
    showToast(
      error ? "No se pudo guardar el nombre." : "Nombre actualizado",
      error ? "error" : "success"
    );
  }

  const TABS = [
    { key: "dashboard" as Tab, label: "Resumen",  icon: LayoutDashboard },
    { key: "clientes"  as Tab, label: "Clientes", icon: Users },
    { key: "reseñas"   as Tab, label: "Reseñas",  icon: Star },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        businessName={businessName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={signOut}
        onRenameBusiness={handleRename}
        notificaciones={notificaciones}
        notifCount={notifCount}
        onDescartar={descartar}
        onDescartarTodas={descartarTodas}
      />

      <div className="border-b bg-background/85 backdrop-blur-xl sticky top-[56px] z-40">
        <div className="max-w-[1320px] mx-auto px-8 flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors",
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && <DashboardScreen businessName={businessName} />}
      {tab === "clientes"  && (
        <ClientesScreen userId={user.id} nombreNegocio={businessName} showToast={showToast} />
      )}
      {tab === "reseñas" && (
        <ReseñasScreen userId={user.id} nombreNegocio={businessName} showToast={showToast} />
      )}

      {showOnboarding && (
        <OnboardingTour
          userId={user.id}
          onComplete={() => window.location.reload()}
        />
      )}

      <ToastPortal />
    </div>
  );
}
