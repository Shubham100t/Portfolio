"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { CosmicDust } from "./environment/CosmicDust";
import { BasicAstronaut } from "./cinematic/BasicAstronaut";
import { BlackHole } from "./celestial/BlackHole";
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
        minDistance={1.8}
        maxDistance={60}
        rotateSpeed={0.7}
        panSpeed={0.6}
        zoomSpeed={0.8}
        target={[0, 0.4, 0]}
      />

      {/* --- CINEMATIC LIGHTING --- */}
      {/* Deep-space ambient baseline */}
      <ambientLight intensity={0.4} color="#0f172a" />

      {/* Frontal Stellar Key Light */}
      <directionalLight
        position={[6, 8, 8]}
        intensity={2.2}
        color="#ffffff"
      />

      {/* Accretion Disk Incandescent Radiance (Warm Gold fill from singularity) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={3.8}
        color="#fbbf24"
        distance={25}
        decay={1.8}
      />

      {/* Relativistic Blueshift Rim Light */}
      <directionalLight
        position={[-8, 3, 4]}
        intensity={1.8}
        color="#38bdf8"
      />

      {/* Deep Void Backlight */}
      <directionalLight
        position={[0, -6, -8]}
        intensity={1.2}
        color="#1e1b4b"
      />

      {/* --- ENVIRONMENT --- */}
      {/* Twinkling background star field */}
      <Stars
        radius={220}
        depth={90}
        count={8500}
        factor={5.5}
        saturation={0.6}
        fade
        speed={1.0}
      />

      {/* Local floating cosmic dust particles */}
      <CosmicDust count={750} />

      {/* --- CELESTIAL SPECTACLE: CINEMATIC BLACK HOLE --- */}
      {/* Gargantua singularity located at cosmic origin [0, 0, 0] */}
      <BlackHole
        position={[0, 0, 0]}
        eventHorizonRadius={1.35}
        diskInnerRadius={1.65}
        diskOuterRadius={7.2}
        dopplerStrength={0.88}
      />

      {/* --- CENTRAL PROTAGONIST (STANDOFF POSITION) --- */}
      {/* Astronaut positioned at standoff coordinates facing the singularity */}
      <group position={[0, -0.15, 4.2]} rotation={[0, 0.25, 0]}>
        <BasicAstronaut />
      </group>

      {/* --- POST-PROCESSING: PHOTON RADIANCE & BLOOM --- */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          luminanceThreshold={0.75}
          luminanceSmoothing={0.3}
          intensity={1.1}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}