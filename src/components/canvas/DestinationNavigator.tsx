"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { DESTINATION_POSITIONS } from "./celestial/Destinations";

/** Gives each destination an actual arrival: click a nav item, camera coasts to
 * a cinematic observation point, then OrbitControls return when the panel closes. */
export function DestinationNavigator() {
  const { camera } = useThree();
  const active = useUniverseStore((s) => s.activeDestination);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (!active) return;
    const point = DESTINATION_POSITIONS[active];
    target.set(...point);
    const distance = active === "about" ? 9.2 : 10;
    desired.copy(target).add(new THREE.Vector3(0, 2.2, distance));
    const smoothing = 1 - Math.exp(-delta * 1.65);
    camera.position.lerp(desired, smoothing);
    camera.lookAt(target);
  });
  return null;
}
