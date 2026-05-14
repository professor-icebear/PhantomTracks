import { useEffect, useState } from "react";

type Step = { i: string; label: string; sub: string };

/**
 * Animated pipeline: glowing nodes, flowing dashed connectors,
 * and a "data packet" that travels through each stage in sequence.
 */
export const Pipeline = ({ steps }: { steps: Step[] }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-y-8 sm:gap-y-12 gap-x-6">
        {steps.map((p, idx) => {
          const isActive = idx === active;
          const isLast = idx === steps.length - 1;
          return (
            <div key={p.label} className="relative">
              {/* Index + label */}
              <div className="font-mono-ui text-muted-foreground mb-3 md:mb-4 flex items-center gap-2">
                <span
                  className={[
                    "inline-block h-1.5 w-1.5 rounded-full transition-all duration-500",
                    isActive
                      ? "bg-primary shadow-[0_0_12px_hsl(var(--phantom-glow)/0.9)] scale-125"
                      : "bg-border",
                  ].join(" ")}
                />
                <span className={isActive ? "text-foreground transition-colors" : "transition-colors"}>
                  {p.i} {p.label}
                </span>
              </div>

              {/* Animated dashed connector with traveling pulse */}
              <div className="relative my-4 md:my-6 h-px overflow-hidden">
                <div className="dash-flow absolute inset-0 opacity-70" />
                <div
                  className="pipe-pulse absolute top-1/2 -translate-y-1/2 h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_18px_hsl(var(--phantom-glow)/0.9)]"
                  style={{ animationDelay: `${idx * 0.4}s` }}
                />
              </div>

              {/* Sub label with active glow */}
              <div
                className={[
                  "font-mono-ui transition-all duration-500",
                  isActive ? "text-primary" : "text-foreground/70",
                ].join(" ")}
              >
                {p.sub}
              </div>

              {/* Inter-node arrow (desktop) */}
              {!isLast && (
                <div className="hidden md:block absolute right-[-14px] top-2 text-primary arrow-drift" style={{ animationDelay: `${idx * 0.2}s` }}>
                  →
                </div>
              )}

              {/* Inter-node arrow (mobile, vertical) */}
              {!isLast && (
                <div className="sm:hidden mt-4 flex items-center gap-2 text-primary/80">
                  <span className="arrow-drift inline-block rotate-90 text-primary" style={{ animationDelay: `${idx * 0.2}s` }}>→</span>
                  <span className="font-mono-ui text-muted-foreground">next</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reactive waveform: bar nearest the active stage glows brightest */}
      <ReactiveWave active={active} steps={steps.length} />
    </div>
  );
};

const ReactiveWave = ({ active, steps }: { active: number; steps: number }) => {
  // Fewer bars on small screens to keep it crisp and performant
  const barsPerCol = typeof window !== "undefined" && window.innerWidth < 640 ? 6 : 11;
  return (
    <div className="mt-10 md:mt-12 grid grid-cols-6 items-end gap-2 sm:gap-4 md:gap-6">
      {Array.from({ length: steps }).map((_, col) => {
        const distance = Math.abs(col - active);
        const intensity = Math.max(0, 1 - distance / 2.5); // 0..1
        return (
          <div key={col} className="flex h-16 sm:h-20 md:h-24 items-end justify-around">
            {Array.from({ length: barsPerCol }).map((_, b) => {
              const baseH = 18 + ((Math.sin(col * 1.7 + b * 0.9) + 1) * 32);
              const delay = ((col * 90 + b * 70) % 1400) / 1000;
              const duration = 1.1 + ((b * 13 + col * 7) % 110) / 100;
              return (
                <span
                  key={b}
                  className="wave-bar block w-[2px] rounded-full transition-colors duration-700"
                  style={{
                    height: `${baseH}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    backgroundColor: `hsl(var(--primary) / ${0.35 + intensity * 0.6})`,
                    boxShadow: intensity > 0.4
                      ? `0 0 ${6 + intensity * 14}px hsl(var(--phantom-glow) / ${intensity * 0.7})`
                      : "none",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};