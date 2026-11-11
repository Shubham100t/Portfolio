"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { QUALITY_PRESETS } from "@/lib/quality";

interface HawkingRadiationProps {
  eventHorizonRadius: number;
  count?: number;
}

interface BurstSparkProps {
  angle: number;
  phase: number;
  speed: number;
  eventHorizonRadius: number;
  color: string;
}

function BurstSpark({ angle, phase, speed, eventHorizonRadius, color }: BurstSparkProps) {
  const sparkRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame(({ clock }) => {
    if (!sparkRef.current || !materialRef.current) return;
    const cycle = (clock.getElapsedTime() * speed + phase) % 1;
    const ignite = THREE.MathUtils.smoothstep(cycle, 0.03, 0.12);
    const fade = 1 - THREE.MathUtils.smoothstep(cycle, 0.28, 0.55);
    const burst = ignite * fade;
    const radius = eventHorizonRadius * (1.09 + cycle * 1.25);
    const curvedAngle = angle + Math.sin(cycle * Math.PI) * 0.18;

    sparkRef.current.position.set(Math.cos(curvedAngle) * radius, Math.sin(curvedAngle) * radius, 0);
    sparkRef.current.scale.setScalar(0.35 + burst * 1.45);
    materialRef.current.opacity = burst * 0.95;
  });

  return (
    <mesh ref={sparkRef} renderOrder={4}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * Stylized quantum-vacuum bursts. Unlike a static ring, only a few emitters
 * ignite at once, producing irregular violet/cyan sparks flowing outward from
 * the visible horizon. This is cinematic visualization, not literal Hawking
 * luminosity from a supermassive black hole.
 */
export function HawkingRadiation({ eventHorizonRadius, count }: HawkingRadiationProps) {
  const rimRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const quality = useUniverseStore((s) => s.quality);
  const sparkCount = count ?? QUALITY_PRESETS[quality].hawkingSparks;
  const bursts = useMemo(
    () => Array.from({ length: sparkCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      phase: Math.random(),
      speed: 0.16 + Math.random() * 0.12,
      color: Math.random() > 0.28 ? "#a855f7" : "#38bdf8",
    })),
    [sparkCount]
  );

  useFrame(() => {
    if (rimRef.current) rimRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={rimRef} renderOrder={4}>
      {bursts.map((burst, index) => (
        <BurstSpark key={index} {...burst} eventHorizonRadius={eventHorizonRadius} />
      ))}
    </group>
  );
}
