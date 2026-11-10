"use client";

import dynamic from "next/dynamic";
import { BrandingOverlay } from "@/components/ui/BrandingOverlay";

// Dynamically import UniverseCanvas with SSR disabled to guarantee clean WebGL hydration
const UniverseCanvas = dynamic(
  () => import("@/components/canvas/UniverseCanvas").then((mod) => mod.UniverseCanvas),
  { ssr: false }
);

export default function CosmosHome() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Persistent Three.js Canvas */}
      <UniverseCanvas />

      {/* Contextual Sci-Fi UI and Branding */}
      <BrandingOverlay />
    </main>
  );
}
