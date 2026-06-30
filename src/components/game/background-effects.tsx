'use client';

/**
 * Ambient animated background — pure CSS @keyframes, zero JS runtime.
 * Layered: deep base + drifting gradient orbs + grid + noise + vignette.
 */
export function BackgroundEffects() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* Drifting gradient orbs */}
      <div
        className="absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full opacity-[0.35] blur-[120px] animate-drift"
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.78 0.2 145 / 0.55), transparent 60%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full opacity-[0.28] blur-[120px] animate-float-slow"
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.78 0.16 70 / 0.5), transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-[-12rem] left-1/4 h-[34rem] w-[34rem] rounded-full opacity-[0.22] blur-[120px] animate-float-slower"
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.7 0.2 300 / 0.45), transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.025] mix-blend-overlay" />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0 0 / 0.55) 100%)',
        }}
      />
    </div>
  );
}
