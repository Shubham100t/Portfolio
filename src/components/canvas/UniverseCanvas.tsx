"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneManager } from "./SceneManager";

export function UniverseCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden cursor-grab active:cursor-grabbing bg-black">
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
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Canvas>
    </div>
  );
}