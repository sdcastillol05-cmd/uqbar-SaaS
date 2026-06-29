/**
 * Static ambient background for the dashboard: gradient orbs + a faint
 * dotted mesh grid for texture. No animation, no `motion` import.
 *
 * Why static, not animated:
 * The dashboard is where the user actually works — typing, tapping,
 * scrolling, watching the AI panel load. Any infinite-loop background
 * animation competes for the same GPU/main-thread budget as those real
 * interactions, and on a mid/low-end phone (the realistic device for a
 * Colombian micro-business owner) that competition is what causes
 * visible jank, even at idle. A perfectly optimized animation is still
 * not free — the only animation with zero ongoing cost is no animation.
 * The login screen keeps its (optimized, transform-only) motion because
 * it's a much shorter, lower-interaction moment.
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-[18%] -left-[14%] w-[760px] h-[760px] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 16%, transparent), transparent 65%)",
        }}
      />
      <div
        className="absolute top-[20%] -right-[10%] w-[560px] h-[560px] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #00bbff 10%, transparent), transparent 65%)",
        }}
      />
      {/* These two extra orbs only render on md+ screens — keeps the
          mobile paint surface smaller even though nothing here animates. */}
      <div
        className="hidden md:block absolute bottom-[5%] left-[20%] w-[420px] h-[420px] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #00e0a4 8%, transparent), transparent 65%)",
        }}
      />
      <div
        className="hidden md:block absolute bottom-[30%] right-[18%] w-[340px] h-[340px] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #ff5ca8 7%, transparent), transparent 65%)",
        }}
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
