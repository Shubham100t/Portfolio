"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import vertexShader from "@/shaders/spaghettification.vert.glsl";
import fragmentShader from "@/shaders/spaghettification.frag.glsl";
import { useUniverseStore } from "@/stores/useUniverseStore";

export function TidalSheath() {
  const material = useRef<THREE.ShaderMaterial>(null!);
  const progress = useUniverseStore((s) => s.cinematicProgress);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uProgress: { value: 0 } }), []);
  useFrame((_, delta) => { uniforms.uTime.value += delta; uniforms.uProgress.value = progress; });
  return <mesh scale={[0.75, 1.9, 0.75]}>
    <sphereGeometry args={[1, 48, 48]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
  </mesh>;
}
