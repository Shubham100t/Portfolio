"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { CosmicDust } from "./environment/CosmicDust";
import { BasicAstronaut } from "./cinematic/BasicAstronaut";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function SceneManager() {
  const { camera } = useThree();
  const setCameraCoords = useUniverseStore((state) => state.setCameraCoords);

  // Sync camera position to global HUD telemetry
  useFrame(() => {
    setCameraCoords({
      x: parseFloat(camera.position.x.toFixed(2)),
      y: parseFloat(camera.position.y.toFixed(2)),
      z: parseFloat(camera.position.z.toFixed(2)),
    });
  });

  return (
    <>
      {/* --- ORBIT & NAVIGATION CONTROLS --- */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={35}
        rotateSpeed={0.7}
        panSpeed={0.6}
        zoomSpeed={0.8}
        target={[0, 0.75, 0]}
      />

      {/* --- CINEMATIC LIGHTING --- */}
      {/* Deep-space ambient baseline fill */}
      <ambientLight intensity={0.8} color="#1e293b" />

      {/* Primary Key Light: Frontal stellar radiance illuminating astronaut and gold visor */}
      <directionalLight
        position={[6, 8, 8]}
        intensity={2.6}
        color="#ffffff"
      />

      {/* Cyan Fill Light: Subtle galactic illumination from the left */}
      <directionalLight
        position={[-6, 3, 6]}
        intensity={1.2}
        color="#93c5fd"
      />

      {/* Relativistic Rim Light: Sharp edge definition against the cosmic void */}
      <directionalLight
        position={[-8, -5, -7]}
        intensity={2.2}
        color="#38bdf8"
      />

      {/* Warm Nebula Bounce Light */}
      <pointLight
        position={[2, -4, 4]}
        intensity={0.8}
        color="#fbbf24"
        distance={30}
      />

      {/* --- ENVIRONMENT --- */}
      {/* Ultra-reliable, twinkling background star field */}
      <Stars
        radius={150}
        depth={80}
        count={7500}
        factor={5}
        saturation={0.5}
        fade
        speed={1.2}
      />

      {/* Close-proximity floating cosmic dust for zero-G motion parallax */}
      <CosmicDust count={700} />

      {/* --- CENTRAL PROTAGONIST --- */}
      <BasicAstronaut />
    </>
  );
}
