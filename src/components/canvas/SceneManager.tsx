"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import { CosmicDust } from "./environment/CosmicDust";
import { BasicAstronaut } from "./cinematic/BasicAstronaut";
import { CinematicDirector } from "./cinematic/CinematicDirector";
import { BlackHole } from "./celestial/BlackHole";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function SceneManager() {
  const { camera } = useThree();
  const mode = useUniverseStore((state) => state.mode);
  const setCameraCoords = useUniverseStore((state) => state.setCameraCoords);

  // Ref forwarded to BasicAstronaut — CinematicDirector animates this group
  const astronautRef = useRef<THREE.Group>(null);

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
      {/* Disabled during cinematic mode so GSAP owns the camera */}
      <OrbitControls
        makeDefault
        enabled={mode !== "cinematic"}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.8}
        maxDistance={60}
        rotateSpeed={0.7}
        panSpeed={0.6}
        zoomSpeed={0.8}
        target={[0, 0.4, 0]}
      />

      {/* --- CINEMATIC TIMELINE DIRECTOR (R3F inner) --- */}
      {mode === "cinematic" && <CinematicDirector astronautRef={astronautRef} />}

      {/* --- CINEMATIC LIGHTING --- */}
      <ambientLight intensity={0.4} color="#0f172a" />
      <directionalLight position={[6, 8, 8]} intensity={2.2} color="#ffffff" />
      <pointLight
        position={[0, 0, 0]}
        intensity={3.8}
        color="#fbbf24"
        distance={25}
        decay={1.8}
      />
      <directionalLight position={[-8, 3, 4]} intensity={1.8} color="#38bdf8" />
      <directionalLight position={[0, -6, -8]} intensity={1.2} color="#1e1b4b" />

      {/* --- ENVIRONMENT --- */}
      <Stars
        radius={220}
        depth={90}
        count={8500}
        factor={5.5}
        saturation={0.6}
        fade
        speed={1.0}
      />
      <CosmicDust count={750} />

      {/* --- CELESTIAL SPECTACLE: CINEMATIC BLACK HOLE --- */}
      <BlackHole
        position={[0, 0, 0]}
        eventHorizonRadius={1.35}
        diskInnerRadius={1.65}
        diskOuterRadius={7.2}
        dopplerStrength={0.88}
      />

      {/* --- CENTRAL PROTAGONIST (STANDOFF POSITION) --- */}
      {/* Outer group at standoff; CinematicDirector animates the inner group via ref */}
      <group position={[0, -0.15, 4.2]} rotation={[0, 0.25, 0]}>
        <BasicAstronaut ref={astronautRef} />
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