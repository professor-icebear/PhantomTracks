import { PhantomMark } from "@/components/PhantomMark";
import { HeroWaves } from "@/components/HeroWaves";
import { SectionLabel } from "@/components/SectionLabel";
import { Pipeline } from "@/components/Pipeline";
import { useReveal } from "@/hooks/useReveal";
import { ArrowUpRight } from "lucide-react";

const APP_URL = "#"; // replace with the actual app URL

const benefits = [
  { n: "1", title: "Hidden in plain sight", desc: "Data is encoded into ordinary-looking playlists. Nothing to flag, nothing to scan." },
  { n: "2", title: "Zero infrastructure", desc: "Spotify hosts the bytes. You hold the key. No servers, no buckets, no bills." },
  { n: "3", title: "Built for whispers", desc: "Share covertly through Spotify DMs. The carrier is a song; the payload is yours." },
];

const pipeline = [
  { i: "(1)", label: "Input", sub: "File / message" },
  { i: "(2)", label: "Encode", sub: "Bits → track IDs" },
  { i: "(3)", label: "Playlist", sub: "Ordered sequence" },
  { i: "(4)", label: "Spotify DM", sub: "Covert delivery" },
  { i: "(5)", label: "Decode", sub: "Sequence → bits" },
  { i: "(6)", label: "Output", sub: "Original payload" },
];

const provides = [
  { title: "A new kind of dead-drop", body: "Phantom Tracks turns the world's biggest music platform into a quiet, ambient channel for slow data — a digital dead-drop hidden between bass lines." },
  { title: "Playlists as cold storage", body: "Small files, secret notes, and slow-burn payloads encoded into the order, length, and identity of tracks. Slow, deliberate, durable." },
  { title: "DMs as the carrier wave", body: "Send a playlist to a friend. They see music. The right client sees a message. Both are true." },
];

const Index = () => {
  useReveal();
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* HERO */}
      <section className="relative h-[100svh] w-full grain snap-start snap-always overflow-hidden">
        <HeroWaves />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent,hsl(0_0%_4%/0.92))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

        {/* Top nav */}
        <header className="relative z-10 flex items-center justify-center pt-6 md:pt-10">
          <div className="flex items-center gap-2 text-foreground">
            <span className="font-display text-xl md:text-2xl tracking-tight">phantom tracks</span>
            <PhantomMark className="text-primary" />
          </div>
        </header>

        {/* Headline */}
        <div className="relative z-10 flex min-h-[calc(100svh-9rem)] items-center py-24">
          <div className="grid w-full grid-cols-12 gap-y-2 px-5 md:px-12">
            <h1
              className="reveal is-visible font-display col-span-12 md:col-span-5 text-[clamp(2.25rem,9vw,5.5rem)] font-light leading-[1.02] text-foreground"
              style={{ transitionDelay: "120ms" }}
            >
              This is data
            </h1>
            <div className="col-span-12 md:col-span-2" />
            <h1
              className="reveal is-visible font-display col-span-12 md:col-span-5 text-[clamp(2.25rem,9vw,5.5rem)] font-light leading-[1.02] text-foreground text-glow md:text-right"
              style={{ transitionDelay: "420ms" }}
            >
              between the notes.
            </h1>
          </div>
        </div>

        {/* Pill nav */}
        <nav className="absolute bottom-6 md:bottom-10 left-1/2 z-10 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md md:w-auto">
          <div className="flex items-center justify-center gap-0.5 md:gap-1 rounded-full bg-background/90 px-1.5 py-1.5 md:px-2 md:py-2 backdrop-blur ring-1 ring-border">
            <a href="#concept" className="px-2.5 md:px-4 py-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">Concept</a>
            <a href="#process" className="px-2.5 md:px-4 py-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">Process</a>
            <a href="#why" className="px-2.5 md:px-4 py-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">Why</a>
            <a
              href={APP_URL}
              className="ml-0.5 md:ml-1 inline-flex items-center gap-1 rounded-full bg-primary px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-primary-foreground hover:bg-accent transition-colors whitespace-nowrap"
            >
              Open app <ArrowUpRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </a>
          </div>
        </nav>
      </section>

      {/* CONCEPT — black with editorial grid */}
      <section id="concept" className="snap-start snap-always min-h-[100svh] flex flex-col justify-center border-t border-border bg-background px-5 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-12 gap-6">
          <SectionLabel className="col-span-12 mb-10 md:mb-24">Concept</SectionLabel>
          <h2 className="reveal font-display col-span-12 md:col-span-7 text-[clamp(2rem,4.5vw,4rem)] font-light leading-[1.05]">
            A better way to hide things, from beginning to end.
          </h2>
          <div className="reveal col-span-12 md:col-span-4 md:col-start-9 space-y-4 text-base leading-relaxed text-muted-foreground mt-6 md:mt-0 md:pt-3" style={{ transitionDelay: "150ms" }}>
            <p>
              Phantom Tracks is a steganography experiment that turns Spotify
              playlists into a quiet little filesystem — and Spotify DMs into a
              private courier.
            </p>
            <p>
              Encode a payload into a sequence of tracks, share the playlist
              like any other, and let the right recipient pull the message back
              out. To everyone else, it's just music.
            </p>
          </div>
        </div>

        {/* Pipeline */}
        <div id="process" className="reveal mt-16 md:mt-24 rounded-sm border border-border bg-card/50 p-5 md:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--phantom-glow)/0.10),transparent_60%)]" />
          <div className="relative">
            <Pipeline steps={pipeline} />
          </div>
        </div>
      </section>

      {/* BENEFITS — black list */}
      <section id="why" className="snap-start snap-always min-h-[100svh] flex flex-col justify-center border-t border-border bg-background px-5 md:px-12 py-16 md:py-20">
        <SectionLabel className="block pb-8 md:pb-12">Benefits of the protocol</SectionLabel>
        <div className="divide-y divide-border border-y border-border">
          {benefits.map((b, i) => (
            <div
              key={b.n}
              className="reveal grid grid-cols-12 items-baseline gap-x-4 gap-y-4 py-8 md:py-14"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="col-span-12 md:col-span-1" />
              <div className="col-span-2 md:col-span-1 font-display text-2xl md:text-5xl font-light text-muted-foreground">{b.n}</div>
              <h3 className="col-span-10 md:col-span-7 font-display text-2xl md:text-5xl font-light leading-[1.1]">
                {b.title}
              </h3>
              <p className="col-span-12 md:col-span-3 text-sm leading-relaxed text-muted-foreground md:pl-0">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE PROVIDE — bone panel */}
      <section className="snap-start snap-always min-h-[100svh] flex flex-col justify-center bg-bone text-bone-foreground px-5 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <span className="font-mono-ui col-span-12 mb-8 md:mb-16 text-bone-foreground/60">What it provides</span>
          {provides.map((p, i) => (
            <div
              key={p.title}
              className="reveal col-span-12 md:col-span-4 flex flex-col gap-4 md:gap-6"
              style={{ transitionDelay: `${i * 140}ms` }}
            >
              <div className="h-px w-full bg-bone-foreground/20" />
              <h3 className="font-display text-2xl md:text-4xl font-light leading-[1.15]">{p.title}</h3>
              <p className="text-sm leading-relaxed text-bone-foreground/70 max-w-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="snap-start snap-always min-h-[100svh] flex flex-col justify-center relative border-t border-border bg-background px-5 md:px-12 py-16 md:py-24 overflow-hidden grain">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(142_70%_30%/0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <SectionLabel className="block mb-8 md:mb-10">Try it</SectionLabel>
          <h2 className="reveal font-display text-[clamp(2.25rem,10vw,6rem)] font-light leading-[1.05] text-glow">
            Start hiding<br />in plain playlists.
          </h2>
          <p className="reveal mx-auto mt-6 md:mt-8 max-w-md text-sm md:text-base text-muted-foreground" style={{ transitionDelay: "150ms" }}>
            The app is a small, scrappy prototype. Bring a Spotify account and a sense of humor.
          </p>
          <div className="reveal mt-10 md:mt-12" style={{ transitionDelay: "300ms" }}>
            <a
              href={APP_URL}
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 md:px-8 py-3.5 md:py-4 text-sm md:text-base font-medium text-primary-foreground transition-all hover:bg-accent hover:shadow-[var(--shadow-glow)]"
            >
              Launch Phantom Tracks
              <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="snap-end border-t border-border bg-background px-5 md:px-12 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <PhantomMark className="text-primary" />
            <span className="font-mono-ui text-muted-foreground">phantom tracks</span>
          </div>
          <span className="font-mono-ui text-muted-foreground">© {new Date().getFullYear()} — encoded with care</span>
        </div>
      </footer>
    </main>
  );
};

export default Index;
