"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A tiny rocky body on a deliberately visible gravitationally-deflected path. */
export function DeflectedAsteroid() {
  const asteroidRef = useRef<THREE.Group>(null!);
  const trailPositions = useMemo(() => new Float32Array(30 * 3), []);
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    return geometry;
  }, [trailPositions]);
  const trail = useMemo(
    () => new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: "#60a5fa", transparent: true, opacity: 0.22 })),
    [trailGeometry]
  );

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const progress = (0.2 + elapsed * 0.035) % 1;
    const x = -8.2 + progress * 16.4;
    const bend = 1.5 * Math.exp(-Math.pow(x / 2.2, 2));
    const y = -1.75 + bend;
    const z = 1.75 + 0.16 * Math.sin(progress * Math.PI);

    if (asteroidRef.current) {
      asteroidRef.current.position.set(x, y, z);
      asteroidRef.current.rotation.set(elapsed * 0.5, elapsed * 0.75, elapsed * 0.32);
    }

    const attribute = trailGeometry.getAttribute("position") as THREE.BufferAttribute;
    for (let point = 0; point < 30; point += 1) {
      const p = Math.max(0, progress - (29 - point) * 0.006);
      const trailX = -8.2 + p * 16.4;
      const trailBend = 1.5 * Math.exp(-Math.pow(trailX / 2.2, 2));
      trailPositions[point * 3] = trailX;
      trailPositions[point * 3 + 1] = -1.75 + trailBend;
      trailPositions[point * 3 + 2] = 1.75 + 0.16 * Math.sin(p * Math.PI);
    }
    attribute.needsUpdate = true;
  });

  return (
    <>
      <primitive object={trail} renderOrder={1} />
      <group ref={asteroidRef}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.11, 1]} />
          <meshStandardMaterial color="#78716c" roughness={0.98} metalness={0.05} />
        </mesh>
        <pointLight color="#93c5fd" intensity={0.2} distance={0.8} />
      </group>
    </>
  );
}
