"use client";

import { useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { BrandingOverlay } from "@/components/ui/BrandingOverlay";
import { CinematicOverlay } from "@/components/ui/CinematicOverlay";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { NavigationOverlay } from "@/components/ui/NavigationOverlay";
import { DestinationPanel } from "@/components/ui/DestinationPanel";
import { CompassRadar } from "@/components/ui/CompassRadar";
import { SemanticPortfolio } from "@/components/ui/SemanticPortfolio";

// Dynamically import UniverseCanvas with SSR disabled to guarantee clean WebGL hydration
const UniverseCanvas = dynamic(
  () => import("@/components/canvas/UniverseCanvas").then((mod) => mod.UniverseCanvas),
  { ssr: false }
);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function CosmosHome() {
  const mode = useUniverseStore((s) => s.mode);
  const isFallback = mode === "fallback";

  // Runs before first paint so reduced-motion visitors never glimpse a
  // letterboxed prologue that is about to be cancelled.
  useIsomorphicLayoutEffect(() => {
    const store = useUniverseStore.getState();

    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      const probe = document.createElement("canvas");
      context = probe.getContext("webgl2") ?? probe.getContext("webgl");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      context = null;
    }
    if (!context) {
      store.setMode("fallback");
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      useUniverseStore.getState().setReducedMotion(query.matches);
      const current = useUniverseStore.getState();
      if (query.matches && current.mode === "cinematic") {
        current.setCinematicProgress(0);
        current.setMode("exploring");
      }
    };

    applyMotionPreference();
    query.addEventListener("change", applyMotionPreference);
    return () => query.removeEventListener("change", applyMotionPreference);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {isFallback ? <SemanticPortfolio /> : <UniverseCanvas />}

      {/* Cinematic prologue overlay — letterbox, subtitles, skip button */}
      {!isFallback && <CinematicOverlay />}

      {/* Sci-Fi HUD branding — hidden during cinematic mode and text edition */}
      {!isFallback && mode !== "cinematic" && <BrandingOverlay />}
      {!isFallback && <NavigationOverlay />}
      {!isFallback && <CompassRadar />}
      {!isFallback && <DestinationPanel />}
    </main>
  );
}
