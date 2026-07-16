"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Sun, Moon, LogOut, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NotificacionesPanel } from "@/components/notificaciones/notificaciones-panel";
import type { Notificacion } from "@/hooks/use-notificaciones";

interface NavbarProps {
  businessName: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogout: () => void;
  onRenameBusiness: (newName: string) => Promise<void>;
  // Notificaciones
  notificaciones: Notificacion[];
  notifCount: number;
  onDescartar: (id: string) => void;
  onDescartarTodas: () => void;
}

export function Navbar({
  businessName,
  theme,
  onToggleTheme,
  onLogout,
  onRenameBusiness,
  notificaciones,
  notifCount,
  onDescartar,
  onDescartarTodas,
}: NavbarProps) {
  const [editing, setEditing]           = useState(false);
  const [draft, setDraft]               = useState(businessName);
  const [prevBusinessName, setPrev]     = useState(businessName);
  const [notifOpen, setNotifOpen]       = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);

  if (businessName !== prevBusinessName) {
    setPrev(businessName);
    setDraft(businessName);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === businessName) { setDraft(businessName); return; }
    await onRenameBusiness(trimmed);
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 border-b bg-background/85 backdrop-blur-2xl">
      {/* LEFT — logo + business name */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
          <div
            className="absolute inset-0 rounded-full blur-md opacity-60"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--primary) 55%, transparent), transparent 70%)",
            }}
          />
          <Image
            src="/logouq.png"
            alt="Uqbar"
            width={24}
            height={24}
            className="relative z-10 rounded-lg object-contain"
            priority
          />
        </div>

        <span className="text-display text-[1rem]">Uqbar</span>
        <Separator orientation="vertical" className="h-4" />

        {editing ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") inputRef.current?.blur();
              if (e.key === "Escape") { setDraft(businessName); setEditing(false); }
            }}
            maxLength={40}
            className="h-7 w-40 text-sm font-semibold ring-2 ring-primary/30"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[0.875rem] font-semibold text-muted-foreground truncate max-w-[160px]">
              {businessName}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md p-1 transition-colors"
              title="Editar nombre"
            >
              <Pencil className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT — actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleTheme}
          className="size-9"
          title="Cambiar tema"
        >
          {theme === "dark" ? <Sun className="size-[15px]" /> : <Moon className="size-[15px]" />}
        </Button>

        {/* Notifications */}
        <NotificacionesPanel
          notificaciones={notificaciones}
          count={notifCount}
          open={notifOpen}
          onToggle={() => setNotifOpen((o) => !o)}
          onDescartar={onDescartar}
          onDescartarTodas={onDescartarTodas}
        />

        {/* User avatar */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-border shrink-0 bg-gradient-to-br from-[color-mix(in_srgb,var(--primary)_22%,var(--card))] to-card">
          <Image src="/logouq.png" alt="" width={18} height={18} className="object-contain" />
        </div>

        <Button variant="outline" size="sm" onClick={onLogout} className="gap-1.5">
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </nav>
  );
}
