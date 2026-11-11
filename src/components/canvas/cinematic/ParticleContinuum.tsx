"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";

/** A single persistent particle buffer: near the horizon it streams outward,
 * then settles into the explorable universe after the prologue. */
export function ParticleContinuum({ count = 2600 }: { count?: number }) {
  const points = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.pow(Math.random(), 0.55) * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.cos(phi) * 0.55;
      data[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return data;
  }, [count]);
  const mode = useUniverseStore((s) => s.mode);

  useFrame(({ clock }) => {
    if (!points.current) return;
    const material = points.current.material as THREE.PointsMaterial;
    material.opacity = mode === "cinematic" ? 0.9 : 0.55;
    const still = useUniverseStore.getState().reducedMotion;
    points.current.rotation.y = still ? 0 : clock.getElapsedTime() * 0.008;
  });

  return <points ref={points} renderOrder={-1}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#9be7ff" size={0.055} sizeAttenuation transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>;
}
