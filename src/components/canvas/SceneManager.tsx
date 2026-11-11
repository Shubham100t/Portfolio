"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { CosmicDust } from "./environment/CosmicDust";
import { BasicAstronaut } from "./cinematic/BasicAstronaut";
import { CinematicDirector } from "./cinematic/CinematicDirector";
import { BlackHole } from "./celestial/BlackHole";
import { DeflectedAsteroid } from "./celestial/DeflectedAsteroid";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { ParticleContinuum } from "./cinematic/ParticleContinuum";
import { Destinations } from "./celestial/Destinations";
import { FlightController } from "./FlightController";
import { DestinationNavigator } from "./DestinationNavigator";
import { GravitationalLens } from "./effects/GravitationalLens";
import { QUALITY_PRESETS } from "@/lib/quality";

export function SceneManager() {
  const { camera } = useThree();
  const mode = useUniverseStore((state) => state.mode);
  const quality = useUniverseStore((state) => state.quality);
  const reducedMotion = useUniverseStore((state) => state.reducedMotion);
  const setCameraCoords = useUniverseStore((state) => state.setCameraCoords);
  const preset = QUALITY_PRESETS[quality];

  // Ref forwarded to BasicAstronaut — CinematicDirector animates this group
  const astronautRef = useRef<THREE.Group>(null);

  // Target is set once instead of through a prop: re-declaring it every render
  // would snap the orbit pivot back to the origin when a panel closes.
  const controlsRef = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    controlsRef.current?.target.set(0, 0.4, 0);
  }, []);

  // Sync camera position and facing to the HUD telemetry / compass radar.
  const forward = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    camera.getWorldDirection(forward);
    setCameraCoords(
      {
        x: parseFloat(camera.position.x.toFixed(2)),
        y: parseFloat(camera.position.y.toFixed(2)),
        z: parseFloat(camera.position.z.toFixed(2)),
      },
      Math.atan2(forward.x, forward.z)
    );
  });

  return (
    <>
      {/* --- ORBIT & NAVIGATION CONTROLS --- */}
      {/* Disabled during cinematic mode so GSAP owns the camera. Stays enabled
          while a destination panel is open so the landmark can be orbited and
          zoomed; DestinationNavigator disables it only during the fly-in. */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={mode !== "cinematic"}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.8}
        maxDistance={60}
        rotateSpeed={0.7}
        panSpeed={0.6}
        zoomSpeed={0.8}
      />

      {/* --- CINEMATIC TIMELINE DIRECTOR (R3F inner) --- */}
      {mode === "cinematic" && <CinematicDirector astronautRef={astronautRef} />}
      <FlightController />
      <DestinationNavigator />

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
        count={preset.stars}
        factor={5.5}
        saturation={0.6}
        fade
        speed={reducedMotion ? 0 : 1.0}
      />
      <CosmicDust count={preset.dust} />
      <ParticleContinuum count={preset.continuum} />
      <DeflectedAsteroid />

      {/* --- CELESTIAL SPECTACLE: CINEMATIC BLACK HOLE --- */}
      <BlackHole
        position={[0, 0, 0]}
        eventHorizonRadius={1.35}
        diskInnerRadius={1.65}
        diskOuterRadius={7.2}
        dopplerStrength={0.88}
      />
      <Destinations />

      {/* --- CENTRAL PROTAGONIST (STANDOFF POSITION) --- */}
      {/* The outer group is world-space: CinematicDirector animates it with
          absolute coordinates, and the inner group holds the 3/4 presentation
          rotation so handing control back never disturbs the astronaut's
          facing. Kept near the camera axis so the full figure stays framed. */}
      <group ref={astronautRef} position={[-1.65, 0.7, 4.6]}>
        <group rotation={[0, 1.15, 0]}>
          <BasicAstronaut />
        </group>
      </group>

      {/* --- POST-PROCESSING: LENSING, PHOTON RADIANCE & BLOOM --- */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <GravitationalLens eventHorizonRadius={1.35} />
        <Bloom
          luminanceThreshold={0.75}
          luminanceSmoothing={0.3}
          intensity={preset.bloomIntensity}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
