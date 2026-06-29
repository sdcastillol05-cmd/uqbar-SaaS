"use client";

import { motion } from "motion/react";

/**
 * A richer, layered ambient background: four softly animated gradient
 * orbs at different depths/sizes, a faint dotted mesh grid for texture,
 * and a subtle noise overlay. Pure CSS + Motion, no extra assets.
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[760px] h-[760px] rounded-full -top-[18%] -left-[14%] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 16%, transparent), transparent 65%)",
        }}
        animate={{ x: [0, 26, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[560px] h-[560px] rounded-full top-[20%] -right-[10%] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #00bbff 10%, transparent), transparent 65%)",
        }}
        animate={{ x: [0, -22, 0], y: [0, 24, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: -4 }}
      />
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full bottom-[5%] left-[20%] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #00e0a4 8%, transparent), transparent 65%)",
        }}
        animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -9 }}
      />
      <motion.div
        className="absolute w-[340px] h-[340px] rounded-full bottom-[30%] right-[18%] blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #ff5ca8 7%, transparent), transparent 65%)",
        }}
        animate={{ x: [0, -14, 0], y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: -2 }}
      />

      {/* Faint dotted mesh for subtle texture across the whole canvas */}
      <div
        className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_20%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 0)",
          backgroundSize: "34px 34px",
        }}
      />
    </div>
  );
}
