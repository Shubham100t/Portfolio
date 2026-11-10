"use client";

import dynamic from "next/dynamic";
import { BrandingOverlay } from "@/components/ui/BrandingOverlay";
import { CinematicOverlay } from "@/components/ui/CinematicOverlay";
import { useUniverseStore } from "@/stores/useUniverseStore";

// Dynamically import UniverseCanvas with SSR disabled to guarantee clean WebGL hydration
const UniverseCanvas = dynamic(
  () => import("@/components/canvas/UniverseCanvas").then((mod) => mod.UniverseCanvas),
  { ssr: false }
);

export default function CosmosHome() {
  const mode = useUniverseStore((s) => s.mode);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Persistent Three.js Canvas */}
      <UniverseCanvas />

      {/* Cinematic prologue overlay — letterbox, subtitles, skip button */}
      <CinematicOverlay />

      {/* Sci-Fi HUD branding — hidden during cinematic mode */}
      {mode !== "cinematic" && <BrandingOverlay />}
    </main>
  );
}