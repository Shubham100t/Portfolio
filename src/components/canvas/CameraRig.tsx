"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function CameraRig() {
  const { camera } = useThree();
  const setCameraCoords = useUniverseStore((state) => state.setCameraCoords);

  // Smooth mouse target offset for zero-G parallax
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const targetLookAt = useRef(new THREE.Vector3(0, 0.75, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.75, 0));

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousPointer.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Gentle subtle parallax when moving mouse
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.targetX = normX * 0.8;
      mouse.current.targetY = normY * 0.6;

      // Orbit/pan offset if user drags
      if (isDragging.current) {
        const deltaX = (e.clientX - previousPointer.current.x) * 0.003;
        const deltaY = (e.clientY - previousPointer.current.y) * 0.003;

        mouse.current.x -= deltaX * 2.0;
        mouse.current.y += deltaY * 2.0;

        previousPointer.current = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useFrame((_, delta) => {
    // Smooth kinematic inertia easing
    const dampFactor = Math.min(delta * 4.0, 1.0);
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * dampFactor;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * dampFactor;

    // Base camera orbit position
    const baseDistance = 5.2;
    const targetCamX = Math.sin(mouse.current.x * 0.8) * baseDistance;
    const targetCamZ = Math.cos(mouse.current.x * 0.8) * baseDistance;
    const targetCamY = 0.85 + mouse.current.y * 1.5;

    camera.position.x += (targetCamX - camera.position.x) * dampFactor;
    camera.position.y += (targetCamY - camera.position.y) * dampFactor;
    camera.position.z += (targetCamZ - camera.position.z) * dampFactor;

    // Smooth look-at interpolation
    currentLookAt.current.lerp(targetLookAt.current, dampFactor);
    camera.lookAt(currentLookAt.current);

    // Sync coordinates with global store for HUD telemetry
    setCameraCoords({
      x: parseFloat(camera.position.x.toFixed(2)),
      y: parseFloat(camera.position.y.toFixed(2)),
      z: parseFloat(camera.position.z.toFixed(2)),
    });
  });

  return null;
}
