"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  accretionDiskVertexShader,
  accretionDiskFragmentShader,
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
  diskOuterRadius = 6.4,
  dopplerStrength = 0.88,
}: BlackHoleProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const raymarchMatRef = useRef<THREE.ShaderMaterial>(null!);
  const photonRingRef = useRef<THREE.Mesh>(null!);

  const sphereRadius = diskOuterRadius * 1.1;
  const photonRadius = eventHorizonRadius * 1.5;

  // Uniforms for relativistic raymarched black hole & accretion disk
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uBlackHolePosition: { value: new THREE.Vector3(...position) },
      uEventHorizonRadius: { value: eventHorizonRadius },
      uInnerRadius: { value: diskInnerRadius },
      uOuterRadius: { value: diskOuterRadius },
      uDopplerStrength: { value: dopplerStrength },
      uSphereRadius: { value: sphereRadius },
    }),
    [position, eventHorizonRadius, diskInnerRadius, diskOuterRadius, dopplerStrength, sphereRadius]
  );

  useFrame((_, delta) => {
    // 1. Advance shader clock & sync camera position
    if (raymarchMatRef.current) {
      raymarchMatRef.current.uniforms.uTime.value += delta;
      raymarchMatRef.current.uniforms.uCameraPosition.value.copy(camera.position);
      raymarchMatRef.current.uniforms.uBlackHolePosition.value.set(...position);
    }

    // 2. Subtle precession
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;
    }

    // 3. Subtle photon ring pulsation
    if (photonRingRef.current) {
      const osc = 1.0 + Math.sin(uniforms.uTime.value * 2.5) * 0.006;
      photonRingRef.current.scale.set(osc, osc, osc);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 1. SCHWARZSCHILD EVENT HORIZON: Absolute black singularity core */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[eventHorizonRadius, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 2. PHOTON SPHERE RING: 1.5 Rs incandescent boundary */}
      <mesh ref={photonRingRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={0}>
        <ringGeometry args={[photonRadius - 0.03, photonRadius + 0.03, 128]} />
        <meshBasicMaterial
          color="#fffbeb"
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. RELATIVISTIC RAYMARCHED ACCRETION DISK & GRAVITATIONAL LENS */}
      {/* Unified geodesic solver: computes primary disk, lensed upper/lower halo arcs, and starlight bending */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[sphereRadius, 64, 64]} />
        <shaderMaterial
          ref={raymarchMatRef}
          vertexShader={accretionDiskVertexShader}
          fragmentShader={accretionDiskFragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}