"use client";

import { ArrowLeft, Orbit } from "lucide-react";
import { DestinationId } from "@/types/universe";
import { portfolio } from "@/data/portfolio";
import { useUniverseStore } from "@/stores/useUniverseStore";

const ORDER: DestinationId[] = ["about", "skills", "projects", "achievements", "contact", "resume"];

/**
 * Crawlable, keyboard-first edition of the portfolio. Used when WebGL is
 * unavailable and whenever the visitor picks Text Mode, so the content never
 * depends on the 3D scene for access.
 */
export function SemanticPortfolio() {
  const setMode = useUniverseStore((s) => s.setMode);

  return (
    <div className="relative z-40 h-screen w-screen overflow-y-auto bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,0.22),transparent_55%)] text-slate-100">
      <article className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10">
        <header className="border-b border-slate-800 pb-8">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] text-sky-400 uppercase">
            <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
            Cosmos // Text Edition
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-[0.18em] uppercase text-white">
            An Interactive Universe
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            The full portfolio without the 3D prologue. Every destination from the
            interactive universe is reproduced below in reading order.
          </p>
          <button
            onClick={() => setMode("exploring")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-200 transition-colors hover:border-sky-300 hover:bg-sky-500/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Return to the 3D universe
          </button>
        </header>

        <nav aria-label="Portfolio sections" className="mt-8">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {ORDER.map((id) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:text-sky-300 focus-visible:text-sky-300">
                  {portfolio[id].eyebrow.split(" // ")[0]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 space-y-14">
          {ORDER.map((id) => {
            const entry = portfolio[id];
            return (
              <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-10">
                <p className="font-mono text-[10px] tracking-[0.3em] text-sky-400 uppercase">
                  {entry.eyebrow}
                </p>
                <h2 id={`${id}-title`} className="mt-3 text-2xl font-light leading-snug text-white">
                  {entry.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{entry.summary}</p>
                <ul className="mt-4 space-y-1 border-l border-amber-400/25 pl-4 font-mono text-xs leading-6 text-amber-200/90">
                  {entry.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="mt-16 border-t border-slate-800 pt-6 font-mono text-[10px] tracking-[0.24em] uppercase text-slate-500">
          <p>
            Content source: <span className="text-slate-400">src/data/portfolio.ts</span>
          </p>
          <button
            onClick={() => setMode("exploring")}
            className="mt-3 text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
          >
            Launch the interactive universe
          </button>
        </footer>
      </article>
    </div>
  );
}
