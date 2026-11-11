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
 *   t= 0 s  [0, 1.5, 9.2]   fov 48   — Establishing: astronaut 3/4, deep cosmos
 *   t=12 s  [0, 1.55, 9.05] fov 47.6 — Barely-there drift; full figure framed
 *   t=25 s  [0.15, 1.25, 7.4] fov 45 — Gravitational pull begins, body stretches
 *   t=40 s  [0.55, 1.15, 11.2] fov 38 — Pull back so the elongated body stays framed
 *   t=55 s  [0.35, 0.55, 5.4] fov 30 — Telephoto push onto the photon ring
 *
 * The astronaut itself travels from the standoff to just in front of the
 * horizon, so the singularity never swallows it before the dissolve reads.
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

  // Shared exit used by both natural completion and Skip. Restores the camera
  // and the astronaut synchronously so exploration mode never inherits the
  // warped, off-screen state from the descent.
  const handoffToExploration = () => {
    if (skipTweenRef.current) return;

    if (astronautRef.current) {
      astronautRef.current.position.set(-1.65, 0.7, 4.6);
      astronautRef.current.rotation.set(0, 0, 0);
    }

    const progressProxy = { p: useUniverseStore.getState().cinematicProgress };
    skipTweenRef.current = gsap.to(camProxy.current, {
      x: 0,
      y: 1.5,
      z: 9.2,
      fov: 48,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: applyCamera,
      onComplete: () => {
        skipTweenRef.current = null;
        setMode("exploring");
      },
    });
    gsap.to(progressProxy, {
      p: 0,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => setCinematicProgress(progressProxy.p),
    });
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
        y: 1.55,
        z: 9.05,
        fov: 47.6,
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
        x: 0.15,
        y: 1.25,
        z: 7.4,
        fov: 45,
        duration: 13,
        ease: "power2.inOut",
        onUpdate: () => {
          applyCamera();
          setCinematicProgress(tl.progress());
        },
      },
      12
    );

    // Astronaut is drawn downrange toward the singularity, but it stops short
    // of the horizon: the remaining distance is covered by the dissolving
    // sparks. Turning it roughly 3/4 lets the stretch read along the frame's
    // vertical while the visor still catches the disk light.
    if (astronautRef.current) {
      tl.to(
        astronautRef.current.position,
        { x: 0.45, y: 0.05, z: 1.9, duration: 13, ease: "power2.inOut" },
        12
      );
    }

    // ── Beat 3: 25 → 40 s — Gravitational Pull ────────────────────────────
    // The camera backs off as the tide takes over: the body more than doubles
    // in height, so holding the dolly-in would push its head out of frame.
    tl.to(
      camProxy.current,
      {
        x: 0.55,
        y: 1.15,
        z: 11.2,
        fov: 38,
        duration: 15,
        ease: "power2.out",
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
        { x: 0.5, y: -0.15, z: 1.6, duration: 15, ease: "power2.inOut" },
        25
      );
      // Turn toward the singularity as gravity takes over.
      tl.to(
        astronautRef.current.rotation,
        { y: 0.75, duration: 30, ease: "power1.inOut" },
        25
      );
    }

    // ── Beat 4: 40 → 55 s — Photon Ring Descent ───────────────────────────
    // Only sparks remain by now, so the camera can close in on the horizon.
    tl.to(
      camProxy.current,
      {
        x: 0.35,
        y: 0.55,
        z: 5.4,
        fov: 30,
        duration: 15,
        ease: "power2.inOut",
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
        { x: 0.5, y: -0.25, z: 1.45, duration: 15, ease: "power1.inOut" },
        40
      );
    }

    // ── Sequence complete ──────────────────────────────────────────────────
    tl.call(() => {
      handoffToExploration();
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
      // A click and an Escape keypress can arrive in the same frame. The shared
      // hand-off guards against both driving the camera at once.
      if (skipTweenRef.current) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      handoffToExploration();
    };

    (window as any).__cosmosSkipIntro = skip;
    return () => {
      delete (window as any).__cosmosSkipIntro;
    };
  }, [camera, setMode, setCinematicProgress, astronautRef]);

  // This component has no visual output — it only orchestrates
  return null;
}
