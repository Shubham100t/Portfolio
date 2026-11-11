"use client";

import { X } from "lucide-react";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { portfolio } from "@/data/portfolio";

export function DestinationPanel() {
  const active = useUniverseStore((s) => s.activeDestination);
  const setActive = useUniverseStore((s) => s.setActiveDestination);
  if (!active) return null;
  const entry = portfolio[active];
  return <section aria-live="polite" className="fixed right-5 top-5 z-40 w-[min(92vw,28rem)] border border-sky-300/25 bg-slate-950/90 p-6 text-slate-100 shadow-2xl backdrop-blur-xl pointer-events-auto">
    <button aria-label="Close destination" onClick={() => setActive(null)} className="absolute right-3 top-3 p-2 text-slate-400 hover:text-white"><X size={18} /></button>
    <p className="pr-8 font-mono text-[10px] tracking-[0.22em] text-sky-300">{entry.eyebrow}</p>
    <h2 className="mt-3 text-2xl font-light leading-snug text-white">{entry.title}</h2>
    <p className="mt-3 text-sm leading-6 text-slate-300">{entry.summary}</p>
    <ul className="mt-5 border-t border-slate-700/70 pt-4 font-mono text-xs leading-6 text-amber-200/90">{entry.facts.map((fact) => <li key={fact}>// {fact}</li>)}</ul>
    {active === "resume" && <p className="mt-5 text-xs text-slate-500">Edit <code>src/data/portfolio.ts</code> to replace this sample resume payload.</p>}
  </section>;
}
