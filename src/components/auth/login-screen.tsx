"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Completa los dos campos.");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("Invalid")
          ? "Correo o contraseña incorrectos."
          : error.message
      );
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!business || !email || !password) {
      setError("Completa todos los campos.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña necesita al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, business);
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full -top-1/4 -left-1/5 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 45%, transparent), transparent 65%)",
          }}
          animate={{ x: [0, 24, 0], y: [0, -34, 0], scale: [1, 1.07, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full -bottom-1/6 -right-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, #00bbff 22%, transparent), transparent 65%)",
          }}
          animate={{ x: [0, -20, 0], y: [0, 28, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: -5 }}
        />
        <motion.div
          className="absolute w-[420px] h-[420px] rounded-full top-[8%] right-[18%] blur-3xl opacity-70"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, #00e0a4 30%, transparent), transparent 65%)",
          }}
          animate={{ x: [0, 16, 0], y: [0, 22, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: -9 }}
        />
        <motion.div
          className="absolute w-[360px] h-[360px] rounded-full bottom-[12%] left-[12%] blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, #ff5ca8 28%, transparent), transparent 65%)",
          }}
          animate={{ x: [0, -14, 0], y: [0, -18, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: -3 }}
        />
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-0 max-w-[980px] w-full px-5 py-10">
        {/* LEFT — hero text, hidden on mobile */}
        <div className="hidden md:flex flex-col pr-10 justify-center">
          <div className="flex items-center gap-2.5 mb-12">
            <Image
              src="/logouq.png"
              alt="Uqbar"
              width={36}
              height={36}
              className="rounded-lg drop-shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
            />
            <span className="text-display text-xl">Uqbar</span>
          </div>

          <h1 className="text-display text-[2.75rem] leading-[1.05] mb-4">
            Tu negocio,
            <br />
            <span className="bg-gradient-to-r from-[#c4b0ff] via-[#9163ff] to-[#00e0a4] bg-clip-text text-transparent">
              en un solo lugar.
            </span>
          </h1>
          <p className="text-muted-foreground text-[0.95rem] leading-relaxed mb-9 max-w-[370px]">
            Registra, visualiza y entiende lo que pasa en tu negocio cada
            día. Simple. Rápido. Tuyo.
          </p>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Zap className="size-4 text-accent-foreground" />
              <span>Listo en 30 segundos</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Shield className="size-4 text-accent-foreground" />
              <span>Datos 100% privados</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Smartphone className="size-4 text-accent-foreground" />
              <span>Funciona en cualquier dispositivo</span>
            </div>
          </div>
        </div>

        {/* RIGHT — form card */}
        <div className="flex flex-col items-center gap-4 justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[400px] rounded-3xl border bg-card backdrop-blur-2xl p-9 pb-7 shadow-2xl glow-primary"
          >
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="flex flex-col"
                >
                  <div className="mb-6">
                    <h2 className="text-display text-2xl mb-1">Bienvenido</h2>
                    <p className="text-sm text-muted-foreground">
                      Ingresa a tu espacio de trabajo
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Correo electrónico
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="nombre@correo.com"
                          autoComplete="email"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pl-9 pr-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-1 gap-2 shadow-lg glow-primary"
                  >
                    {loading ? "Ingresando…" : "Entrar"}
                    {!loading && <ArrowRight className="size-4" />}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿Primera vez?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className="text-accent-foreground hover:underline font-medium"
                    >
                      Crea tu cuenta gratis
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="flex flex-col"
                >
                  <div className="mb-6">
                    <h2 className="text-display text-2xl mb-1">
                      Empieza hoy
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configura tu espacio en un minuto
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Nombre de tu negocio
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Ej: Estudio Creativo"
                          className="pl-9"
                          value={business}
                          onChange={(e) => setBusiness(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Correo electrónico
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="nombre@correo.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          className="pl-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-1 gap-2 shadow-lg glow-primary"
                  >
                    {loading ? "Creando cuenta…" : "Crear cuenta"}
                    {!loading && <Sparkles className="size-4" />}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="text-accent-foreground hover:underline font-medium"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-xs text-muted-foreground">
            por <strong>Uqbar</strong> ·{" "}
            <a
              href="https://uqbar.app"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              uqbar.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
