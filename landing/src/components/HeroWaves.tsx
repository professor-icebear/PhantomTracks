import nebula from "@/assets/hero-nebula.jpg";

/**
 * Artistic hero composition:
 *   1. Drifting volumetric nebula clouds (two parallaxed layers)
 *   2. A faint rotating "vinyl" orb behind the headline
 *   3. A horizon waveform at the bottom — pure CSS bars, GPU-accelerated
 *   4. Floating particle motes rising slowly
 *   5. Subtle scanline sweep for cinematic feel
 */
export const HeroWaves = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const BARS = isMobile ? 56 : 140;
  const MOTES = isMobile ? 14 : 28;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Layer 1 — deep nebula, slow drift */}
      <img
        src={nebula}
        alt=""
        width={1920}
        height={1080}
        className="nebula-a absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
      />
      {/* Layer 2 — same nebula, mirrored, slower reverse drift, blurred for depth */}
      <img
        src={nebula}
        alt=""
        width={1920}
        height={1080}
        className="nebula-b absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen blur-2xl scale-x-[-1]"
      />

      {/* Vinyl orb — concentric rings behind the headline */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 orb-breathe">
        <div className="orb-spin relative h-[70vmin] w-[70vmin] rounded-full">
          {/* Soft glow */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--phantom-glow)/0.18),transparent_60%)]" />
          {/* Concentric rings */}
          {[100, 86, 72, 58, 44, 30, 16].map((size) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
              style={{ width: `${size}%`, height: `${size}%` }}
            />
          ))}
          {/* Center spindle */}
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_hsl(var(--phantom-glow)/0.9)]" />
          {/* Tick marks every 30 degrees */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-primary/40"
              style={{
                transformOrigin: "50% 35vmin",
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating motes */}
      <div className="absolute inset-0">
        {Array.from({ length: MOTES }).map((_, i) => {
          const left = (i * 97) % 100;
          const size = 1 + ((i * 7) % 3);
          const duration = 14 + ((i * 11) % 22); // 14s – 36s
          const delay = -((i * 31) % 30);
          const opacity = 0.25 + ((i * 13) % 60) / 100;
          return (
            <span
              key={i}
              className="mote absolute bottom-[-10%] block rounded-full bg-primary"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                boxShadow: `0 0 ${4 + size * 3}px hsl(var(--phantom-glow) / 0.7)`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* Cinematic scanline sweep */}
      <div className="scan-sweep pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent via-primary/8 to-transparent" />

      {/* Horizon waveform — sits at the bottom edge */}
      <div className="absolute inset-x-0 bottom-0 h-[38%] sm:h-[42%]">
        {/* Mirror reflection beneath */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-10" />
        <div className="flex h-full w-full items-end justify-between gap-[2px] px-3 md:px-10">
          {Array.from({ length: BARS }).map((_, i) => {
            const delay = ((i * 53) % 1600) / 1000;
            const duration = 1.2 + ((i * 17) % 140) / 100;
            const center = BARS / 2;
            const dist = Math.abs(i - center) / center;
            const baseHeight = 8 + (1 - dist) * 70; // 8% – 78%
            return (
              <span
                key={i}
                className="wave-bar block w-[2px] rounded-full bg-gradient-to-t from-primary/90 via-primary/70 to-accent/90 shadow-[0_0_10px_hsl(var(--phantom-glow)/0.45)]"
                style={{
                  height: `${baseHeight}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Vignette to anchor type */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(0_0%_4%/0.7)_85%)]" />
    </div>
  );
};
