"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  accretionDiskVertexShader,
  accretionDiskFragmentShader,
  lensedHaloVertexShader,
  lensedHaloFragmentShader,
} from "@/shaders/blackhole";

interface BlackHoleProps {
  position?: [number, number, number];
  scale?: number;
  eventHorizonRadius?: number;
  diskInnerRadius?: number;
  diskOuterRadius?: number;
  dopplerStrength?: number;
}

export function BlackHole({
  position = [0, 0, 0],
  scale = 1.0,
  eventHorizonRadius = 1.35,
  diskInnerRadius = 1.65,
  diskOuterRadius = 6.8,
  dopplerStrength = 0.88,
}: BlackHoleProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const diskMatRef = useRef<THREE.ShaderMaterial>(null!);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null!);
  const photonRingRef = useRef<THREE.Mesh>(null!);

  const photonRadius = eventHorizonRadius * 1.5; // Theoretical circular photon orbit: 1.5 Rs

  // Normal vector of the tilted equatorial disk
  const diskNormal = useMemo(() => {
    const euler = new THREE.Euler(-Math.PI * 0.46, 0.06, 0);
    return new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();
  }, []);

  // Uniforms for primary equatorial accretion disk
  const diskUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uInnerRadius: { value: diskInnerRadius },
      uOuterRadius: { value: diskOuterRadius },
      uPhotonRadius: { value: photonRadius },
      uDopplerStrength: { value: dopplerStrength },
    }),
    [diskInnerRadius, diskOuterRadius, photonRadius, dopplerStrength]
  );

  // Uniforms for camera-aligned lensed secondary halo
  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uDiskNormal: { value: diskNormal },
      uInnerRadius: { value: eventHorizonRadius * 1.08 },
      uOuterRadius: { value: diskOuterRadius * 0.65 },
      uPhotonRadius: { value: photonRadius },
      uDopplerStrength: { value: dopplerStrength * 0.75 },
    }),
    [diskNormal, eventHorizonRadius, diskOuterRadius, photonRadius, dopplerStrength]
  );

  useFrame((_, delta) => {
    // 1. Advance shader clocks
    if (diskMatRef.current) {
      diskMatRef.current.uniforms.uTime.value += delta;
      diskMatRef.current.uniforms.uCameraPosition.value.copy(camera.position);
    }
    if (haloMatRef.current) {
      haloMatRef.current.uniforms.uTime.value += delta;
      haloMatRef.current.uniforms.uCameraPosition.value.copy(camera.position);
    }

    // 2. Dynamically align the lensed halo with camera view direction
    // This guarantees the lensed arches are ALWAYS seen behind the singularity over/under the horizon
    // eliminating any rigid intersecting geometry or front protruding rings
    if (haloRef.current) {
      haloRef.current.quaternion.copy(camera.quaternion);
    }

    // 3. Subtle slow precession of the physical disk
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
    }

    // 4. Photon ring micro-pulsation
    if (photonRingRef.current) {
      const osc = 1.0 + Math.sin(diskUniforms.uTime.value * 2.8) * 0.007;
      photonRingRef.current.scale.set(osc, osc, osc);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 1. SCHWARZSCHILD EVENT HORIZON: Absolute black singularity core */}
      {/* Occludes anything directly behind the singularity */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[eventHorizonRadius, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 2. PHOTON SPHERE RING: 1.5 Rs incandescent emission boundary */}
      <mesh ref={photonRingRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
        <ringGeometry args={[photonRadius - 0.035, photonRadius + 0.035, 128]} />
        <meshBasicMaterial
          color="#fffbeb"
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.92}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. PRIMARY EQUATORIAL ACCRETION DISK */}
      {/* The single, physical Keplerian disk in 3D space */}
      <mesh rotation={[-Math.PI * 0.46, 0.06, 0]} renderOrder={0}>
        <ringGeometry args={[diskInnerRadius, diskOuterRadius, 128, 64]} />
        <shaderMaterial
          ref={diskMatRef}
          vertexShader={accretionDiskVertexShader}
          fragmentShader={accretionDiskFragmentShader}
          uniforms={diskUniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. DYNAMIC VIEW-ALIGNED LENSED SECONDARY HALO */}
      {/* Simulates light from the back of the disk bent over the top and bottom toward the observer */}
      {/* Centered at [0,0,0], perfectly billboarding to camera, zero front protrusion */}
      <mesh ref={haloRef} renderOrder={0}>
        <ringGeometry args={[eventHorizonRadius * 1.08, diskOuterRadius * 0.65, 128, 48]} />
        <shaderMaterial
          ref={haloMatRef}
          vertexShader={lensedHaloVertexShader}
          fragmentShader={lensedHaloFragmentShader}
          uniforms={haloUniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}