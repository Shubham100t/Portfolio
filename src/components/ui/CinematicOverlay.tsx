"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUniverseStore } from "@/stores/useUniverseStore";

/**
 * CinematicOverlay
 * ==================
 * DOM layer rendered on top of the Canvas during the 55-second prologue.
 *
 * Features:
 *  - 2.39:1 Letterbox bars (top + bottom) that slide in and out
 *  - Sequenced narrative subtitle / telemetry log timed to each cinematic beat
 *  - "Skip Intro" button that calls window.__cosmosSkipIntro() (set by CinematicDirector)
 *  - Smooth fade-out on skip or sequence completion
 */

interface SubtitleEntry {
  time: number;    // seconds into the cinematic
  text: string;
  level: "normal" | "warning" | "critical";
}

const SUBTITLES: SubtitleEntry[] = [
  { time: 0,  text: "COSMOS // PROLOGUE SEQUENCE INITIATED",                   level: "normal"   },
  { time: 5,  text: "POSITION: GARGANTUA PROXIMITY — 4.2 AU",                  level: "normal"   },
  { time: 12, text: "PROXIMITY ALERT // GARGANTUA MASS: 1.0×10⁸ M☉",           level: "normal"   },
  { time: 20, text: "RCS STATUS: THRUSTER PULSE ENGAGED — CLOSING VECTOR",      level: "normal"   },
  { time: 25, text: "⚠ WARNING // GRAVITATIONAL GRADIENT EXCEEDING 9.4G",      level: "warning"  },
  { time: 32, text: "⚠ TIME DILATION FACTOR: τ = 0.61 — CAUTION ADVISED",     level: "warning"  },
  { time: 40, text: "🔴 CRITICAL // EVENT HORIZON THRESHOLD BREACH IMMINENT",   level: "critical" },
  { time: 48, text: "🔴 TIDAL FORCES NOMINAL — SPAGHETTIFICATION VECTOR LOCK", level: "critical" },
  { time: 53, text: "PHASE 3 COMPLETE // INITIATING EXPLORATION MODE",          level: "normal"   },
];

const LEVEL_COLORS: Record<SubtitleEntry["level"], string> = {
  normal:   "text-sky-300",
  warning:  "text-amber-400",
  critical: "text-red-400",
};

export function CinematicOverlay() {
  const mode = useUniverseStore((s) => s.mode);

  // Track elapsed seconds for subtitle sequencing
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);  // fade-in after mount
  const [fadingOut, setFadingOut] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevModeRef = useRef(mode);

  // Show letterbox bars only in cinematic mode
  const isCinematic = mode === "cinematic";

  // On mount in cinematic mode, kick off the elapsed timer
  useEffect(() => {
    if (!isCinematic) return;

    setVisible(false);
    setFadingOut(false);
    setElapsed(0);
    startTimeRef.current = null;

    // Small delay so CSS transition catches the initial hidden state
    const showTimer = setTimeout(() => setVisible(true), 80);

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      setElapsed((now - startTimeRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(showTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCinematic]);

  // Detect mode transition cinematic → exploring → trigger fade-out
  useEffect(() => {
    if (prevModeRef.current === "cinematic" && mode !== "cinematic") {
      setFadingOut(true);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    prevModeRef.current = mode;
  }, [mode]);

  // Provide a keyboard equivalent for the visible Skip Intro control.
  useEffect(() => {
    if (!isCinematic) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCinematic]);

  // Determine which subtitle to show (last one whose time <= elapsed)
  const activeSubtitle = [...SUBTITLES]
    .reverse()
    .find((s) => elapsed >= s.time) ?? null;

  const handleSkip = () => {
    if (typeof (window as any).__cosmosSkipIntro === "function") {
      (window as any).__cosmosSkipIntro();
    }
  };

  // Don't render at all once fade-out animation finishes and we're in exploring mode
  if (!isCinematic && !fadingOut) return null;

  const overlayOpacity = fadingOut ? "opacity-0" : visible ? "opacity-100" : "opacity-0";
  const barHeight = fadingOut ? "h-0" : visible ? "h-[8vh]" : "h-0";
  const gravitationalAlarm = elapsed >= 25 && elapsed < 55;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-20 font-mono select-none transition-opacity duration-700 ${overlayOpacity}`}
      onTransitionEnd={() => {
        if (fadingOut) setFadingOut(false);
      }}
    >
      {/* A restrained lensing pulse signals the escalating gravitational gradient. */}
      {gravitationalAlarm && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(56,189,248,0.08)_68%,rgba(239,68,68,0.18)_100%)] animate-[timeDilation_1.1s_ease-in-out_infinite]"
        />
      )}

      {/* ── TOP LETTERBOX BAR ──────────────────────────────────────────── */}
      <div
        className={`absolute top-0 left-0 w-full bg-black ${barHeight} transition-all duration-700 ease-in-out`}
      />

      {/* ── BOTTOM LETTERBOX BAR ───────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 w-full bg-black ${barHeight} transition-all duration-700 ease-in-out`}
      />

      {/* ── SKIP INTRO BUTTON ─────────────────────────────────────────── */}
      <button
        onClick={handleSkip}
        aria-label="Skip cinematic intro"
        className={`
          pointer-events-auto
          absolute bottom-[9vh] right-6
          flex items-center gap-2
          px-5 py-2 rounded-full
          text-xs tracking-[0.25em] uppercase font-semibold
          text-slate-200 border border-slate-500/60
          bg-black/40 backdrop-blur-sm
          hover:bg-white/10 hover:border-sky-400/50 hover:text-white
          transition-all duration-200 cursor-pointer
          shadow-[0_0_12px_rgba(0,0,0,0.6)]
        `}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        Skip Intro
      </button>

      {/* ── SUBTITLE / TELEMETRY LOG ───────────────────────────────────── */}
      {activeSubtitle && (
        <div
          className={`
            absolute bottom-[9vh] left-1/2 -translate-x-1/2
            px-6 py-2.5 max-w-2xl w-full text-center
          `}
        >
          <p
            key={activeSubtitle.time}
            className={`
              text-[11px] sm:text-sm tracking-[0.3em] uppercase
              ${LEVEL_COLORS[activeSubtitle.level]}
              drop-shadow-[0_0_8px_currentColor]
              animate-[fadeSlideUp_0.5s_ease-out_forwards]
            `}
          >
            {activeSubtitle.text}
          </p>
        </div>
      )}

      {gravitationalAlarm && (
        <div className="absolute top-[9vh] right-6 text-[9px] tracking-[0.28em] uppercase text-red-400/90 animate-pulse">
          {elapsed >= 40 ? "Event Horizon Lock" : "Gravity Alarm Active"}
        </div>
      )}

      {/* ── ELAPSED PROGRESS BAR (thin rule at top of bottom bar) ─────── */}
      <div className="absolute bottom-[8vh] left-0 w-full h-[1px] bg-slate-800">
        <div
          className="h-full bg-sky-500/70 transition-none"
          style={{ width: `${Math.min((elapsed / 55) * 100, 100)}%` }}
        />
      </div>

      {/* ── BEAT INDICATOR (top-left corner of bottom bar) ───────────── */}
      <div className="absolute bottom-[8.6vh] left-6 text-[9px] tracking-[0.3em] text-slate-500 uppercase">
        SEQUENCE {Math.min(Math.floor(elapsed / 13.75) + 1, 4).toString().padStart(2, "0")} / 04
      </div>

      {/* ── ELAPSED TIMER (top-right of bottom bar) ───────────────────── */}
      <div className="absolute bottom-[8.6vh] right-6 text-[9px] tracking-[0.3em] text-slate-500 tabular-nums uppercase">
        T+ {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(Math.floor(elapsed % 60)).padStart(2, "0")}
      </div>
    </div>
  );
}
