"use client";

import { useEffect, useRef, MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";

/**
 * CinematicDirector
 * ==================
 * Lives inside <Canvas>. Builds and plays a 55-second GSAP master timeline that:
 *   - Dolly-animates the Three.js camera position + fov directly
 *   - Moves the astronaut group toward the singularity
 *   - Writes cinematicProgress (0–1) to the global store for shader/UI hooks
 *
 * On completion OR skip: sets mode → 'exploring' and restores the initial camera.
 *
 * Camera keyframes:
 *   t= 0 s  [0, 1.5, 9.2]  fov 48  — Establishing: deep cosmos
 *   t=12 s  [0, 2.2, 7.8]  fov 46  — Drift in; astronaut thruster pulse
 *   t=25 s  [0, 1.0, 5.5]  fov 44  — Gravitational pull begins
 *   t=40 s  [0.8, 0.5, 3.8] fov 41 — Pull intensifies; HUD alarms
 *   t=55 s  [0.3, 0.2, 2.6] fov 38 — Photon ring; spaghettification imminent
 */

interface CinematicDirectorProps {
  astronautRef: MutableRefObject<THREE.Group | null>;
}

export function CinematicDirector({ astronautRef }: CinematicDirectorProps) {
  const { camera } = useThree();
  const setMode = useUniverseStore((s) => s.setMode);
  const setCinematicProgress = useUniverseStore((s) => s.setCinematicProgress);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const skipTweenRef = useRef<gsap.core.Tween | null>(null);
  const camProxy = useRef({ x: 0, y: 1.5, z: 9.2, fov: 48 });

  const applyCamera = () => {
    camera.position.set(camProxy.current.x, camProxy.current.y, camProxy.current.z);
    // Keep Gargantua centred as the dolly passes it; OrbitControls owns this again
    // only after the cinematic has handed control back to exploration mode.
    camera.lookAt(0, 0.4, 0);
    (camera as THREE.PerspectiveCamera).fov = camProxy.current.fov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  };

  useEffect(() => {
    // Guard: only build once
    if (tlRef.current) return;

    // Snap camera to cinematic start
    camera.position.set(0, 1.5, 9.2);
    camProxy.current = { x: 0, y: 1.5, z: 9.2, fov: 48 };
    applyCamera();

    const tl = gsap.timeline({ paused: false });
    tlRef.current = tl;

    // ── Beat 1: 0 → 12 s — Establishing shot ──────────────────────────────
    tl.to(
      camProxy.current,
      {
        x: 0,
        y: 2.2,
        z: 7.8,
        fov: 46,
        duration: 12,
        ease: "power1.inOut",
        onUpdate: () => {
          applyCamera();
          // progress: 0 → 0.22
          setCinematicProgress(tl.progress() * 1);
        },
      },
      0
    );

    // ── Beat 2: 12 → 25 s — Dolly-in / Thruster Pulse ────────────────────
    tl.to(
      camProxy.current,
      {
        x: 0,
        y: 1.0,
        z: 5.5,
        fov: 44,
        duration: 13,
        ease: "power2.inOut",
        onUpdate: () => {
          applyCamera();
          setCinematicProgress(tl.progress());
        },
      },
      12
    );

    // Astronaut drift toward accretion disk during beat 2
    if (astronautRef.current) {
      tl.to(
        astronautRef.current.position,
        { z: 1.2, duration: 13, ease: "power1.inOut" },
        12
      );
    }

    // ── Beat 3: 25 → 40 s — Gravitational Pull ────────────────────────────
    tl.to(
      camProxy.current,
      {
        x: 0.8,
        y: 0.5,
        z: 3.8,
        fov: 41,
        duration: 15,
        ease: "power3.inOut",
        onUpdate: () => {
          applyCamera();
          setCinematicProgress(tl.progress());
        },
      },
      25
    );

    if (astronautRef.current) {
      tl.to(
        astronautRef.current.position,
        { z: 2.3, duration: 15, ease: "power2.inOut" },
        25
      );
    }

    // ── Beat 4: 40 → 55 s — Photon Ring Descent ───────────────────────────
    tl.to(
      camProxy.current,
      {
        x: 0.3,
        y: 0.2,
        z: 2.6,
        fov: 38,
        duration: 15,
        ease: "power4.inOut",
        onUpdate: () => {
          applyCamera();
          setCinematicProgress(tl.progress());
        },
      },
      40
    );

    if (astronautRef.current) {
      tl.to(
        astronautRef.current.position,
        { z: 2.8, duration: 15, ease: "power3.in" },
        40
      );
    }

    // ── Sequence complete ──────────────────────────────────────────────────
    tl.call(() => {
      setCinematicProgress(1);
      setMode("exploring");
    });

    return () => {
      tl.kill();
      tlRef.current = null;
      skipTweenRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose skip handler on the window so CinematicOverlay can call it
  useEffect(() => {
    const skip = () => {
      // A click and an Escape keypress can arrive in the same frame. Keep one
      // deterministic hand-off tween rather than letting them fight for camera state.
      if (skipTweenRef.current) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      // Smooth camera restore
      skipTweenRef.current = gsap.to(camProxy.current, {
        x: 0,
        y: 1.5,
        z: 9.2,
        fov: 48,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          applyCamera();
        },
        onComplete: () => {
          // Reset astronaut to standoff position
          if (astronautRef.current) {
            astronautRef.current.position.set(0, 0, 0);
          }
          setCinematicProgress(0);
          skipTweenRef.current = null;
          setMode("exploring");
        },
      });
    };

    (window as any).__cosmosSkipIntro = skip;
    return () => {
      delete (window as any).__cosmosSkipIntro;
    };
  }, [camera, setMode, setCinematicProgress, astronautRef]);

  // This component has no visual output — it only orchestrates
  return null;
}
