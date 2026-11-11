"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneManager } from "./SceneManager";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { QUALITY_PRESETS } from "@/lib/quality";

export function UniverseCanvas() {
  const quality = useUniverseStore((s) => s.quality);
  const preset = QUALITY_PRESETS[quality];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0 overflow-hidden cursor-grab active:cursor-grabbing bg-black"
    >
      <Canvas
        camera={{
          fov: 48,
          near: 0.1,
          far: 3000,
          position: [0, 1.5, 9.2],
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={preset.dpr}
      >
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Canvas>
    </div>
  );
}