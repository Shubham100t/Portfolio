"use client";

import { useUniverseStore } from "@/stores/useUniverseStore";
import { DestinationId } from "@/types/universe";
const links: { id: DestinationId; label: string }[] = [{ id: "about", label: "About / Black Hole" }, { id: "skills", label: "Skills / Pulsar" }, { id: "projects", label: "Projects / Nebula" }, { id: "achievements", label: "Achievements / Supernova" }, { id: "contact", label: "Contact / Station" }, { id: "resume", label: "Resume / Gateway" }];
export function NavigationOverlay() {
  const mode = useUniverseStore((s) => s.mode); const active = useUniverseStore((s) => s.activeDestination); const setActive = useUniverseStore((s) => s.setActiveDestination);
  if (mode === "cinematic") return null;
  return <aside className="fixed bottom-5 left-5 z-30 w-56 border border-sky-400/20 bg-slate-950/75 p-3 font-mono text-[10px] tracking-wider text-slate-300 backdrop-blur pointer-events-auto">
    <p className="mb-2 text-sky-300">COSMIC NAV // 6-DOF</p>
    <div className="grid gap-1">{links.map((link) => <button key={link.id} onClick={() => setActive(active === link.id ? null : link.id)} className={`text-left px-2 py-1.5 hover:bg-sky-400/10 ${active === link.id ? "text-amber-300 bg-amber-400/10" : ""}`}>{link.label}</button>)}</div>
    <p className="mt-3 text-slate-500">WASD STRAFE · R/F VERTICAL · SHIFT BOOST</p>
  </aside>;
}
