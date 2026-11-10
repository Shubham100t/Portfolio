"use client";

import React, { useState } from "react";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { Compass, Volume2, VolumeX, Eye, ShieldCheck, Sparkles } from "lucide-react";

export function BrandingOverlay() {
  const { cameraCoords, soundEnabled, toggleSound, quality } = useUniverseStore();
  const [showCenterBranding, setShowCenterBranding] = useState(true);

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 z-10 font-mono select-none">
      {/* --- TOP TELEMETRY HUD --- */}
      <header className="flex items-center justify-between w-full">
        {/* Brand mark */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_10px_#38bdf8]" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.25em] text-white hud-glow">
              COSMOS
            </span>
            <span className="text-[10px] tracking-widest text-slate-400">
              SYS_REV: 0.1 // FOUNDATION
            </span>
          </div>
        </div>

        {/* Spatial Coordinate Telemetry */}
        <div className="hidden md:flex items-center gap-6 px-4 py-2 glass-panel rounded-full text-xs text-slate-300 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">POS:</span>
            <span className="text-sky-300 font-bold">
              [{cameraCoords.x.toFixed(2)}, {cameraCoords.y.toFixed(2)}, {cameraCoords.z.toFixed(2)}]
            </span>
          </div>
          <div className="w-[1px] h-3 bg-slate-700" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">RCS:</span>
            <span className="text-emerald-300">ACTIVE</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleSound}
            className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-xs text-slate-300 hover:text-white hover:border-sky-400/50 transition-all cursor-pointer"
            title="Audio Ambience"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
              {soundEnabled ? "Audio On" : "Muted"}
            </span>
          </button>

          <div className="px-3 py-1.5 glass-panel rounded-full text-[11px] text-slate-400 tracking-wider uppercase">
            {quality}
          </div>
        </div>
      </header>

      {/* --- CENTER CINEMATIC BRANDING --- */}
      {showCenterBranding && (
        <main className="self-center text-center my-auto max-w-xl px-6 py-8 glass-panel rounded-2xl flex flex-col items-center pointer-events-auto shadow-2xl border border-sky-500/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full border border-sky-400/30 bg-sky-950/60 text-[10px] tracking-[0.3em] text-sky-300 uppercase">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Exploration Environment
          </div>

          <h1 className="text-4xl sm:text-6xl font-light tracking-[0.35em] text-white uppercase hud-glow mb-2">
            COSMOS
          </h1>

          <p className="text-xs sm:text-sm tracking-[0.45em] text-slate-300 uppercase mb-2">
            An Interactive Universe
          </p>

          <p className="text-[11px] tracking-[0.35em] text-sky-400/90 uppercase mb-6">
            Explore The Unknown
          </p>

          <button
            onClick={() => setShowCenterBranding(false)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs tracking-[0.25em] uppercase font-bold text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 hover:border-sky-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            Enter Zero Gravity
          </button>
        </main>
      )}

      {/* --- BOTTOM TELEMETRY FOOTER --- */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 w-full">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="tracking-wider text-slate-300">PHASE 3 // CINEMATIC TIMELINE ONLINE</span>
        </div>

        <div className="tracking-widest uppercase text-slate-400 text-[10px] hidden sm:block">
          Click & Drag to Orbit 360° // Scroll to Zoom // Zero-G Inertia
        </div>

        {!showCenterBranding && (
          <button
            onClick={() => setShowCenterBranding(true)}
            className="pointer-events-auto text-[10px] text-sky-400 hover:text-sky-300 underline tracking-wider uppercase cursor-pointer"
          >
            Show Identity
          </button>
        )}
      </footer>
    </div>
  );
}
