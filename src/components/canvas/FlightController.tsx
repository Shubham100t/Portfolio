"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function FlightController() {
  const { camera } = useThree();
  const pressed = useRef(new Set<string>());
  const mode = useUniverseStore((s) => s.mode);
  const activeDestination = useUniverseStore((s) => s.activeDestination);
  const enabled = useUniverseStore((s) => s.flightEnabled);
  useEffect(() => {
    const down = (e: KeyboardEvent) => pressed.current.add(e.code);
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useFrame((_, delta) => {
    if (mode === "cinematic" || !enabled || activeDestination) return;
    const speed = (pressed.current.has("ShiftLeft") ? 18 : 7) * delta;
    const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    if (pressed.current.has("KeyW")) camera.position.addScaledVector(forward, speed);
    if (pressed.current.has("KeyS")) camera.position.addScaledVector(forward, -speed);
    if (pressed.current.has("KeyA")) camera.position.addScaledVector(right, -speed);
    if (pressed.current.has("KeyD")) camera.position.addScaledVector(right, speed);
    if (pressed.current.has("KeyR")) camera.position.y += speed;
    if (pressed.current.has("KeyF")) camera.position.y -= speed;
  });
  return null;
}
