"use client";

import { DestinationId } from "@/types/universe";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { DESTINATION_POSITIONS } from "@/components/canvas/celestial/Destinations";

const SIZE = 160;
const MID = SIZE / 2;
const RADIUS = 62;

// Bearings only need the XZ plane, so the radar stays readable no matter how
// much the visitor pitches or zooms.
const BLIPS: { id: DestinationId; label: string; code: string; color: string }[] = [
  { id: "about", label: "About / Black Hole", code: "AB", color: "#f59e0b" },
  { id: "skills", label: "Skills / Pulsar", code: "SK", color: "#a78bfa" },
  { id: "projects", label: "Projects / Nebula", code: "PR", color: "#38bdf8" },
  { id: "achievements", label: "Achievements / Supernova", code: "AC", color: "#fb923c" },
  { id: "contact", label: "Contact / Station", code: "CO", color: "#e2e8f0" },
  { id: "resume", label: "Resume / Wormhole", code: "RS", color: "#fde68a" },
];

export function CompassRadar() {
  const mode = useUniverseStore((s) => s.mode);
  const active = useUniverseStore((s) => s.activeDestination);
  const setActive = useUniverseStore((s) => s.setActiveDestination);
  const heading = useUniverseStore((s) => s.cameraHeading);
  const camera = useUniverseStore((s) => s.cameraCoords);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  if (mode === "cinematic" || mode === "fallback") return null;

  // Camera basis in the XZ plane: forward = (sin h, cos h), right = (-fz, fx).
  const fx = Math.sin(heading);
  const fz = Math.cos(heading);
  const rx = -fz;
  const rz = fx;
  const headingDeg = Math.round((Math.atan2(fx, -fz) * 180) / Math.PI + 360) % 360;

  const blips = BLIPS.map((blip) => {
    const [x, y, z] = DESTINATION_POSITIONS[blip.id];
    const dx = x - camera.x;
    const dz = z - camera.z;
    const distance = Math.hypot(dx, dz);
    const ux = distance > 0.001 ? dx / distance : 0;
    const uz = distance > 0.001 ? dz / distance : 1;

    const along = ux * fx + uz * fz;
    const across = ux * rx + uz * rz;
    const ring = 0.2 + Math.min(distance / 60, 1) * 0.68;
    const px = MID + across * RADIUS * ring;
    const py = MID - along * RADIUS * ring;
    const elevated = y > 6;

    return { ...blip, x, distance, px, py, elevated, isActive: active === blip.id };
  });

  return (
    <section
      aria-label="Destination compass"
      className="fixed bottom-5 right-5 z-30 hidden flex-col items-end gap-1.5 font-mono sm:flex"
    >
      <div className="pointer-events-auto relative rounded-full glass-panel p-1 shadow-[0_0_24px_rgba(2,6,23,0.8)]">
        <div className="relative h-[148px] w-[148px]">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width="148"
            height="148"
            role="img"
            aria-label={`Compass, heading ${headingDeg} degrees`}
            className="block"
          >
            <defs>
              <radialGradient id="radar-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.16" />
                <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            <circle cx={MID} cy={MID} r={RADIUS} fill="url(#radar-core)" />
            <circle cx={MID} cy={MID} r={RADIUS} fill="none" stroke="#38bdf8" strokeOpacity="0.35" />
            <circle cx={MID} cy={MID} r={41} fill="none" stroke="#38bdf8" strokeOpacity="0.14" />
            <circle cx={MID} cy={MID} r={20} fill="none" stroke="#38bdf8" strokeOpacity="0.12" />
            <path d={`M ${MID} ${MID - RADIUS} V ${MID + RADIUS} M ${MID - RADIUS} ${MID} H ${MID + RADIUS}`} stroke="#38bdf8" strokeOpacity="0.12" />

            {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const inner = deg % 90 === 0 ? RADIUS - 7 : RADIUS - 3.5;
              return (
                <line
                  key={deg}
                  x1={MID + Math.sin(rad) * inner}
                  y1={MID - Math.cos(rad) * inner}
                  x2={MID + Math.sin(rad) * RADIUS}
                  y2={MID - Math.cos(rad) * RADIUS}
                  stroke="#7dd3fc"
                  strokeOpacity={deg % 90 === 0 ? 0.5 : 0.22}
                  strokeWidth={deg % 90 === 0 ? 1.2 : 0.7}
                />
              );
            })}

            {blips.map((blip) => (
              <g
                key={blip.id}
                role="button"
                tabIndex={0}
                aria-label={`${blip.label}, ${Math.round(blip.distance)} units away`}
                onClick={() => setActive(blip.isActive ? null : blip.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(blip.isActive ? null : blip.id);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <title>{blip.label}</title>
                {blip.isActive && (
                  <circle cx={blip.px} cy={blip.py} r={7.5} fill="none" stroke={blip.color} strokeOpacity="0.7" strokeWidth="1" />
                )}
                <circle cx={blip.px} cy={blip.py} r={3.1} fill={blip.color} />
                <circle cx={blip.px} cy={blip.py} r={3.1} fill="none" stroke={blip.color} strokeOpacity="0.45" strokeWidth="3" />
                <text
                  x={blip.px}
                  y={blip.py + 11.5}
                  textAnchor="middle"
                  fontSize="6.4"
                  letterSpacing="0.6"
                  fill={blip.color}
                  fillOpacity={blip.isActive ? 1 : 0.7}
                >
                  {blip.code}
                  {blip.elevated ? "↑" : ""}
                </text>
              </g>
            ))}

            {/* Camera marker + forward notch */}
            <circle cx={MID} cy={MID} r={2.2} fill="#e0f2fe" />
            <path d={`M ${MID} ${MID - RADIUS - 3} l -4 7 h 8 z`} fill="#7dd3fc" />
            <text x={MID} y={MID - RADIUS - 8.5} textAnchor="middle" fontSize="6" letterSpacing="1.4" fill="#7dd3fc" fillOpacity="0.85">
              FWD
            </text>
          </svg>

          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-[10px] rounded-full ${reducedMotion ? "" : "animate-[radarSweep_5.5s_linear_infinite]"}`}
            style={{ background: "conic-gradient(from 0deg, rgba(56,189,248,0.18), rgba(56,189,248,0) 58deg)" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pr-1 text-[9px] tracking-[0.28em] uppercase text-sky-300/80">
        <span className="h-1 w-1 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
        HDG {String(headingDeg).padStart(3, "0")}°
      </div>
    </section>
  );
}
