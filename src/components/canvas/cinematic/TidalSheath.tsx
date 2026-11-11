"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import vertexShader from "@/shaders/spaghettification.vert.glsl";
import fragmentShader from "@/shaders/spaghettification.frag.glsl";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function TidalSheath() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uProgress: { value: 0 } }), []);
  // Read progress from the store inside the loop; subscribing here would
  // re-render the whole sheath sixty times a second.
  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uProgress.value = useUniverseStore.getState().cinematicProgress;
  });
  return (
    // Tight oval around the suit (centred between head and boots). The parent
    // group supplies the tidal stretch so the aura hugs the body instead of
    // ballooning past it.
    <mesh position={[0, 0.35, 0]} scale={[0.7, 1.52, 0.7]}>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
