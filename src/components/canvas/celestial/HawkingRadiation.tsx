"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface HawkingRadiationProps {
  eventHorizonRadius: number;
  count?: number;
}

interface SparkProps {
  angle: number;
  phase: number;
  radius: number;
}

function QuantumSpark({ angle, phase, radius }: SparkProps) {
  const sparkRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!sparkRef.current) return;
    const flicker = 0.55 + 0.45 * Math.sin(clock.getElapsedTime() * 5.0 + phase);
    sparkRef.current.scale.setScalar(0.65 + flicker * 0.55);
  });

  return (
    <mesh ref={sparkRef} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} renderOrder={4}>
      <sphereGeometry args={[0.038, 10, 10]} />
      <meshBasicMaterial
        color="#a855f7"
        transparent
        opacity={0.95}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * A visible but sparse quantum-vacuum visualization. The sparks are placed on
 * the viewer-facing horizon rim so they cannot be hidden inside the shadow.
 */
export function HawkingRadiation({ eventHorizonRadius, count = 18 }: HawkingRadiationProps) {
  const rimRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const sparks = useMemo(
    () => Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18,
      phase: Math.random() * Math.PI * 2,
      radius: eventHorizonRadius * (1.12 + Math.random() * 0.14),
    })),
    [count, eventHorizonRadius]
  );

  useFrame(() => {
    if (rimRef.current) rimRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={rimRef} renderOrder={4}>
      {sparks.map((spark, index) => <QuantumSpark key={index} {...spark} />)}
    </group>
  );
}
