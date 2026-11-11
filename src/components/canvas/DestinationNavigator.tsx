"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { DESTINATION_POSITIONS } from "./celestial/Destinations";

type OrbitLike = {
  enabled: boolean;
  target: THREE.Vector3;
  update: () => void;
};

/** Hands the camera to the chosen destination: a short eased arrival, then
 * OrbitControls take over so the visitor can orbit/zoom the landmark while the
 * panel is open. Closing the panel never rewinds the camera. */
export function DestinationNavigator() {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as unknown as OrbitLike | null;
  const active = useUniverseStore((s) => s.activeDestination);
  const mode = useUniverseStore((s) => s.mode);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const arriving = useRef(false);
  const lastTarget = useRef(new THREE.Vector3(0, 0.4, 0));

  useEffect(() => {
    if (active) {
      arriving.current = true;
      lastTarget.current.set(...DESTINATION_POSITIONS[active]);
      if (controls) controls.enabled = false;
      return;
    }
    // Panel closed: keep the current viewpoint, just give input back and make
    // sure the orbit pivot stays on the destination we were inspecting.
    arriving.current = false;
    if (controls) {
      controls.target.copy(lastTarget.current);
      controls.enabled = mode !== "cinematic";
      controls.update();
    }
  }, [active, controls, mode]);

  useFrame((_, delta) => {
    if (!active || !arriving.current) return;

    target.set(...DESTINATION_POSITIONS[active]);
    const distance = active === "about" ? 9.2 : 10;
    desired.copy(target).add(offset.set(0, 2.2, distance));
    camera.position.lerp(desired, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(target);

    if (camera.position.distanceTo(desired) < 0.06) {
      camera.position.copy(desired);
      camera.lookAt(target);
      if (controls) {
        controls.target.copy(target);
        controls.enabled = mode !== "cinematic";
        controls.update();
      }
      arriving.current = false;
    }
  });

  return null;
}
