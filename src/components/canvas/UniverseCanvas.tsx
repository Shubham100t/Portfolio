"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneManager } from "./SceneManager";

export function UniverseCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#020617] -z-10 overflow-hidden cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{
          fov: 52,
          near: 0.1,
          far: 2500,
          position: [0, 1.0, 5.5],
        }}
        gl={{
          antialias: true,
          alpha: false,
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
