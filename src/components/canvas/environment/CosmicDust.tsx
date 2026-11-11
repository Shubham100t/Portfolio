"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function CosmicDust({ count = 600 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const op = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Disperse micro-particles within close range of camera for zero-gravity parallax
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      op[i] = 0.2 + Math.random() * 0.5;
    }

    return [pos, op];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      if (useUniverseStore.getState().reducedMotion) return;
      pointsRef.current.rotation.x += delta * 0.005;
      pointsRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38bdf8"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
