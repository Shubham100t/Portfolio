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
    // A one-way infall: it curves toward the singularity and is never reset
    // into an orbit once it crosses the horizon.
    const progress = Math.min(elapsed * 0.052, 1);
    const remaining = 1 - progress;
    const x = -6.2 * remaining * remaining;
    const y = -1.25 * remaining * remaining + 0.72 * remaining * (1 - remaining);
    const z = 2.3 * remaining * remaining;

    if (asteroidRef.current) {
      asteroidRef.current.position.set(x, y, z);
      asteroidRef.current.rotation.set(elapsed * 0.5, elapsed * 0.75, elapsed * 0.32);
    }

    const attribute = trailGeometry.getAttribute("position") as THREE.BufferAttribute;
    for (let point = 0; point < 30; point += 1) {
      const p = progress * (point / 29);
      const trailRemaining = 1 - p;
      trailPositions[point * 3] = -6.2 * trailRemaining * trailRemaining;
      trailPositions[point * 3 + 1] = -1.25 * trailRemaining * trailRemaining + 0.72 * trailRemaining * (1 - trailRemaining);
      trailPositions[point * 3 + 2] = 2.3 * trailRemaining * trailRemaining;
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
