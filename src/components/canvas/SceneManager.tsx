"use client";

import React from "react";
import { StarField } from "./environment/StarField";
import { CosmicDust } from "./environment/CosmicDust";
import { BasicAstronaut } from "./cinematic/BasicAstronaut";
import { CameraRig } from "./CameraRig";

export function SceneManager() {
  return (
    <>
      {/* --- DEEP SPACE LIGHTING --- */}
      {/* Cool blue ambient cosmic fill */}
      <ambientLight intensity={0.4} color="#0b1536" />

      {/* Primary Key Light: Distant brilliant star cluster */}
      <directionalLight
        position={[12, 18, 15]}
        intensity={2.4}
        color="#f8fafc"
        castShadow={false}
      />

      {/* Relativistic cyan rim light: Defines astronaut silhouette against black void */}
      <directionalLight
        position={[-15, -8, -10]}
        intensity={1.1}
        color="#38bdf8"
      />

      {/* Subtle warm nebula bounce light */}
      <pointLight
        position={[0, -5, 4]}
        intensity={0.6}
        color="#fbbf24"
        distance={25}
        decay={2}
      />

      {/* --- ENVIRONMENT --- */}
      <StarField count={8000} />
      <CosmicDust count={600} />

      {/* --- CELESTIAL PROTAGONIST --- */}
      <BasicAstronaut />

      {/* --- CAMERA RIG --- */}
      <CameraRig />
    </>
  );
}
