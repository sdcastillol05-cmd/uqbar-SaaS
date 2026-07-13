"use client";

// DEPENDENCIA REQUERIDA — corre esto en tu proyecto antes de usar este componente:
//   npm install qrcode
//   npm install --save-dev @types/qrcode

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, QrCode, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GeneradorQRProps {
  negocioId: string;
  nombreNegocio: string;
  mapsUrl?: string | null;
  className?: string;
}

const UQBAR_MORADO  = "#2D1C7F";
const UQBAR_VIOLETA = "#7546E8";
const UQBAR_CREMA   = "#F5F0E8";

export function GeneradorQR({
  negocioId,
  nombreNegocio,
  mapsUrl,
  className,
}: GeneradorQRProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const encuestaUrl = `${window.location.origin}/encuesta/${negocioId}`;

  const drawCard = useCallback(async (canvas: HTMLCanvasElement) => {
    const W = 800;
    const H = 1100;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // ── Fondo morado superior ──
    ctx.fillStyle = UQBAR_MORADO;
    ctx.fillRect(0, 0, W, H);

    // ── Curva crema inferior ──
    ctx.fillStyle = UQBAR_CREMA;
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.bezierCurveTo(0, 310, W, 310, W, 340);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // ── Logo Uqbar (imagen) ──
    try {
      const logo = await loadImage("/logouq.png");
      const logoSize = 72;
      ctx.drawImage(logo, W / 2 - logoSize / 2, 48, logoSize, logoSize);
    } catch {
      // Si no carga el logo, dibujar círculo morado
      ctx.fillStyle = UQBAR_VIOLETA;
      ctx.beginPath();
      ctx.arc(W / 2, 84, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── "Uqbar" debajo del logo ──
    ctx.fillStyle = "#FFFFFF";
    ctx.font      = "bold 42px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Uqbar", W / 2, 200);

    // ── "¡Escanéame!" ──
    ctx.fillStyle = "#FFFFFF";
    ctx.font      = "700 52px Inter, system-ui, sans-serif";
    ctx.fillText("¡Escanéame!", W / 2, 272);

    // ── Subtítulo ──
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font      = "400 28px Inter, system-ui, sans-serif";
    ctx.fillText("y deja tu opinión sobre el servicio", W / 2, 316);

    // ── QR Code ──
    const qrSize = 420;
    const qrX    = W / 2 - qrSize / 2;
    const qrY    = 370;

    // Borde morado alrededor del QR
    const pad = 18;
    ctx.fillStyle   = UQBAR_VIOLETA;
    ctx.shadowColor  = "rgba(117, 70, 232, 0.35)";
    ctx.shadowBlur   = 32;
    roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 24);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 18);
    ctx.fill();

    // Generar QR como data URL y dibujarlo
    const qrDataUrl = await QRCode.toDataURL(encuestaUrl, {
      width:         qrSize,
      margin:        2,
      color:         { dark: UQBAR_MORADO, light: "#FFFFFF" },
      errorCorrectionLevel: "H", // alto — necesario si vamos a superponer logo
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Logo Uqbar pequeño al centro del QR
    try {
      const logoSmall = await loadImage("/logouq.png");
      const lSize = 72;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, W / 2 - lSize / 2 - 6, qrY + qrSize / 2 - lSize / 2 - 6, lSize + 12, lSize + 12, 10);
      ctx.fill();
      ctx.drawImage(logoSmall, W / 2 - lSize / 2, qrY + qrSize / 2 - lSize / 2, lSize, lSize);
    } catch { /* sin logo central */ }

    // ── Nombre del negocio debajo del QR ──
    ctx.fillStyle = UQBAR_MORADO;
    ctx.font      = "700 36px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(nombreNegocio, W / 2, qrY + qrSize + pad * 2 + 48);

    // ── URL pequeña ──
    ctx.fillStyle = "rgba(45,28,127,0.55)";
    ctx.font      = "400 22px Inter, system-ui, sans-serif";
    ctx.fillText("uqbar.app", W / 2, qrY + qrSize + pad * 2 + 86);

    // ── Logo Google esquina inferior izquierda ──
    const googleLogoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="%234285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="%2334A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="%23FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="%23EA4335"/></svg>`;

    try {
      const gLogo = await loadImage(googleLogoSvg);
      const gSize = 44;
      ctx.drawImage(gLogo, 48, H - gSize - 44, gSize, gSize);
      ctx.fillStyle = "rgba(45,28,127,0.55)";
      ctx.font      = "400 20px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(mapsUrl ? "Google Maps" : "Google", 48 + gSize + 10, H - 44 - 12);
    } catch { /* sin logo google */ }

    setReady(true);
  }, [encuestaUrl, nombreNegocio, mapsUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas);
  }, [drawCard]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${nombreNegocio.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Preview del QR */}
      <Card className="relative p-0 overflow-hidden border-card-foreground/5 flex items-center justify-center bg-secondary min-h-[280px]">
        <canvas
          ref={canvasRef}
          className={cn(
            "max-w-full max-h-[380px] object-contain rounded-xl transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0"
          )}
          style={{ width: "auto", height: "380px" }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm gap-2">
            <QrCode className="size-5 animate-pulse" />
            Generando QR...
          </div>
        )}
        <button
          onClick={() => setShowFull(true)}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border text-muted-foreground hover:text-foreground transition-colors"
          title="Ver tamaño completo"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </Card>

      {/* Botones */}
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          onClick={() => setShowFull(true)}
          className="flex-1 gap-2"
          disabled={!ready}
        >
          <QrCode className="size-4" />
          Mostrar al cliente
        </Button>
        <Button
          onClick={handleDownload}
          disabled={!ready}
          className="flex-1 gap-2 glow-primary"
        >
          <Download className="size-4" />
          Descargar PNG
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        URL del QR: <span className="font-mono text-accent-foreground">{encuestaUrl}</span>
      </p>

      {/* Modal pantalla completa para mostrar al cliente */}
      {showFull && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFull(false)}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ maxHeight: "90vh", width: "auto" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
