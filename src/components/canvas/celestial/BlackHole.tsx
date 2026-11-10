"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  accretionDiskVertexShader,
  accretionDiskFragmentShader,
  gravitationalLensVertexShader,
  gravitationalLensFragmentShader,
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
  diskOuterRadius = 7.0,
  dopplerStrength = 0.85,
}: BlackHoleProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  const diskMatRef = useRef<THREE.ShaderMaterial>(null!);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null!);
  const lensMatRef = useRef<THREE.ShaderMaterial>(null!);
  const photonRingRef = useRef<THREE.Mesh>(null!);

  const photonRadius = eventHorizonRadius * 1.5; // Theoretical unstable circular photon orbit: 1.5 Rs

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

  // Uniforms for vertical lensed accretion halo (simulates gravitational bending of rear disk)
  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uInnerRadius: { value: diskInnerRadius * 0.98 },
      uOuterRadius: { value: diskOuterRadius * 0.65 },
      uPhotonRadius: { value: photonRadius },
      uDopplerStrength: { value: dopplerStrength * 0.7 },
    }),
    [diskInnerRadius, diskOuterRadius, photonRadius, dopplerStrength]
  );

  // Uniforms for gravitational lensing distortion shell
  const lensUniforms = useMemo(
    () => ({
      uCameraPosition: { value: new THREE.Vector3() },
      uBlackHolePosition: { value: new THREE.Vector3(...position) },
      uEventHorizonRadius: { value: eventHorizonRadius },
      uStrength: { value: 0.85 },
    }),
    [position, eventHorizonRadius]
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
    if (lensMatRef.current) {
      lensMatRef.current.uniforms.uCameraPosition.value.copy(camera.position);
    }

    // 2. Subtle precession of the accretion plane
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015;
    }

    // 3. Photon ring pulsation
    if (photonRingRef.current) {
      const scaleOsc = 1.0 + Math.sin(diskUniforms.uTime.value * 3.0) * 0.008;
      photonRingRef.current.scale.set(scaleOsc, scaleOsc, scaleOsc);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 1. SCHWARZSCHILD EVENT HORIZON: Absolute black singularity core */}
      <mesh>
        <sphereGeometry args={[eventHorizonRadius, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 2. PHOTON SPHERE RING: 1.5 Rs incandescent emission boundary */}
      <mesh ref={photonRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[photonRadius - 0.045, photonRadius + 0.045, 128]} />
        <meshBasicMaterial
          color="#fffbeb"
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. PRIMARY EQUATORIAL ACCRETION DISK */}
      {/* Slightly tilted for dramatic cinematic composition */}
      <mesh rotation={[-Math.PI * 0.44, 0.05, 0]}>
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

      {/* 4. LENSED SECONDARY ACCRETION HALO */}
      {/* Simulates light from behind the horizon bent vertically over and under the sphere */}
      <mesh rotation={[0.08, 0.12, 0]}>
        <ringGeometry args={[diskInnerRadius * 0.98, diskOuterRadius * 0.65, 128, 48]} />
        <shaderMaterial
          ref={haloMatRef}
          vertexShader={accretionDiskVertexShader}
          fragmentShader={accretionDiskFragmentShader}
          uniforms={haloUniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 5. GRAVITATIONAL LENSING CURVED SPACETIME SHELL */}
      <mesh>
        <sphereGeometry args={[eventHorizonRadius * 2.4, 64, 64]} />
        <shaderMaterial
          ref={lensMatRef}
          vertexShader={gravitationalLensVertexShader}
          fragmentShader={gravitationalLensFragmentShader}
          uniforms={lensUniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}