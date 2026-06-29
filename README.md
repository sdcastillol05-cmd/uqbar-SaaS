# Uqbar — Next.js 15

Reconstrucción completa de Uqbar usando Next.js 15, Tailwind CSS v4,
shadcn/ui, Radix UI, Motion (Framer Motion), Recharts, Lucide y la
fuente variable Inter.

## Stack

- **Next.js 15** (App Router, React 19)
- **Tailwind CSS v4** (sin `tailwind.config.js`, configuración vía `@theme` en `globals.css`)
- **shadcn/ui** — componentes en `src/components/ui/` (Button, Card, Badge, Input, Select, Separator, ScrollArea, Label)
- **Radix UI** — primitivas accesibles detrás de cada componente shadcn
- **Motion** (`motion/react`) — animaciones de entrada, transiciones de tema, toasts
- **Recharts** — gráfico de flujo de caja
- **Lucide React** — iconografía
- **Inter Variable** — vía `next/font/google`
- **Supabase** — Auth + base de datos (sin cambios respecto a la versión anterior)

## Antes de correr el proyecto

### 1. Agrega el logo real

El archivo `public/logouq.png` **no está incluido** — tráelo desde tu
repositorio actual de GitHub y cópialo a `public/logouq.png` antes de
hacer `npm run dev` o desplegar. El layout y el navbar ya están
configurados para usarlo (`<Image src="/logouq.png" .../>` y el ícono
de pestaña del navegador).

### 2. Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

Ese archivo ya trae tu URL y anon key de Supabase actuales. **No subas
`.env.local` a GitHub** — ya está excluido en `.gitignore`. En Vercel,
configura las mismas variables en *Project Settings → Environment
Variables*:

```
NEXT_PUBLIC_SUPABASE_URL=https://ufpnpzbhcbgxiptbcmwe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wqdLMWHV5iENUclFedGNvw_7eHBi7gO
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Correr en local

```bash
npm run dev
```

Abre `http://localhost:3000`.

### 5. Verificar el build de producción (recomendado antes de cada push)

```bash
npm run build
```

Si compila sin errores localmente, el deploy en Vercel también
funcionará — Vercel ejecuta exactamente este mismo comando.

## Desplegar a Vercel

Como ya tienes GitHub conectado a Vercel:

1. Haz commit y push de este proyecto a tu repositorio (asegúrate de
   haber agregado `public/logouq.png` primero).
2. Vercel detecta el push automáticamente y corre `npm install` +
   `npm run build` por ti.
3. Confirma que las variables de entorno (paso 2 arriba) estén
   configuradas en Vercel — si no las agregas ahí, el build fallará
   porque Supabase no tendrá URL ni key.

## Estructura del proyecto

```
src/
  app/
    layout.tsx        → fuente Inter, metadata, tema oscuro por defecto
    page.tsx           → decide entre LoginScreen y DashboardScreen según sesión
    globals.css        → tokens de color (Tailwind v4 @theme), paleta Uqbar
  components/
    ui/                → componentes shadcn/ui (button, card, badge, input, select...)
    auth/
      login-screen.tsx → pantalla de login/registro con Motion
    dashboard/
      navbar.tsx
      kpi-card.tsx
      cash-flow-chart.tsx      → gráfico Recharts
      transactions-list.tsx
      ai-advisor-panel.tsx
      add-transaction-form.tsx
      dashboard-screen.tsx     → ensambla todo el dashboard
  hooks/
    use-auth.ts        → sesión, login, registro, logout, editar nombre de negocio
    use-movimientos.ts → CRUD de movimientos contra Supabase
    use-stats.ts        → cálculo de todas las métricas (hoy/semana/mes/margen/etc)
    use-ai-advice.ts    → llamada a la Edge Function de IA + parser de respuesta
    use-theme.ts        → modo oscuro/claro persistido en localStorage
    use-toast.tsx        → notificaciones tipo toast con Motion
  lib/
    supabase.ts         → cliente de Supabase
    types.ts             → tipos TypeScript (Movimiento, Perfil, etc)
    utils.ts              → función cn() de shadcn
    format.ts              → formato de moneda COP y fechas
```

## Notas importantes

- La Edge Function `ai-advice` en Supabase **no cambia** — sigue siendo
  el mismo código que ya desplegaste. Este proyecto solo cambia cómo
  el frontend la consume.
- Las tablas, políticas RLS y Auth de Supabase **no cambian** en absoluto.
- El componente `<Image>` de Next.js valida en tiempo de build que los
  archivos en `public/` existan — por eso el paso 1 (logo real) es
  obligatorio antes de `npm run build` o el deploy fallará.
