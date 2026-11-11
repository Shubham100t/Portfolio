"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { QUALITY_PRESETS } from "@/lib/quality";

/**
 * The astronaut's body shedding into sparks during tidal spaghettification.
 * Particles are born in the suit's local volume (so they inherit the same
 * stretch as the mesh), then spiral downrange into the singularity.
 */
const vertexShader = /* glsl */ `
  attribute float aSeed;
  varying float vSeed;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;

  void main() {
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.72 + 0.28 * sin(uTime * (2.0 + aSeed * 5.0) + aSeed * 20.0);
    gl_PointSize = clamp(uSize * uPixelRatio * (0.45 + aSeed * 0.9) * twinkle * (220.0 / max(-mv.z, 0.2)), 1.0, 42.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vSeed;
  uniform float uOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.06, d) * uOpacity;
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.35, 0.9, 1.7), vec3(1.9, 0.82, 0.28), pow(vSeed, 1.5));
    gl_FragColor = vec4(col, alpha);
  }
`;

export function sampleSuit(count: number) {
  const base = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const part = Math.random();
    let x = 0;
    let y = 0;
    let z = 0;
    if (part < 0.4) {
      // torso capsule
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.35;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r * 0.8;
      y = 0.15 + Math.random() * 1.15;
    } else if (part < 0.55) {
      // helmet shell
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const r = 0.36 + Math.random() * 0.05;
      x = r * Math.sin(b) * Math.cos(a);
      y = 1.45 + r * Math.cos(b);
      z = r * Math.sin(b) * Math.sin(a);
    } else if (part < 0.72) {
      // arms
      x = (Math.random() > 0.5 ? 1 : -1) * (0.5 + (Math.random() - 0.5) * 0.22);
      y = 0.45 + Math.random() * 0.65;
      z = (Math.random() - 0.5) * 0.2;
    } else if (part < 0.94) {
      // legs
      x = (Math.random() > 0.5 ? 1 : -1) * 0.2 + (Math.random() - 0.5) * 0.18;
      y = -1.15 + Math.random() * 1.25;
      z = (Math.random() - 0.5) * 0.22;
    } else {
      // backpack
      x = (Math.random() - 0.5) * 0.7;
      y = 0.35 + Math.random() * 0.9;
      z = -0.45 + (Math.random() - 0.5) * 0.3;
    }
    base[i * 3] = x;
    base[i * 3 + 1] = y;
    base[i * 3 + 2] = z;
    seeds[i] = Math.random();
  }
  return { base, seeds };
}

export function AstronautDissolve({ count }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const trailRef = useRef<THREE.LineSegments>(null!);
  const { gl } = useThree();
  const quality = useUniverseStore((s) => s.quality);
  const particleCount = count ?? QUALITY_PRESETS[quality].dissolveParticles;
  const { base, seeds } = useMemo(() => sampleSuit(particleCount), [particleCount]);
  const positions = useMemo(() => new Float32Array(base), [base]);
  const prev = useMemo(() => new Float32Array(base), [base]);

  // Each spark gets a two-vertex tail so the pull reads as stretched threads,
  // not a cloud of drifting dots.
  const trailPositions = useMemo(() => new Float32Array(particleCount * 6), [particleCount]);
  const trailColors = useMemo(() => {
    const colors = new Float32Array(particleCount * 6);
    for (let i = 0; i < particleCount; i++) {
      const seed = seeds[i];
      const r = 0.35 + seed * 0.65;
      const g = 0.9 - seed * 0.25;
      const b = 1.0 - seed * 0.75;
      const i6 = i * 6;
      colors[i6] = r;
      colors[i6 + 1] = g;
      colors[i6 + 2] = b;
      colors[i6 + 3] = r * 0.15;
      colors[i6 + 4] = g * 0.15;
      colors[i6 + 5] = b * 0.15;
    }
    return colors;
  }, [seeds, particleCount]);

  const uniforms = useMemo(
    () => ({
      uSize: { value: 0.085 },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    }),
    []
  );

  const scratch = useMemo(() => ({
    inverse: new THREE.Matrix4(),
    bhLocal: new THREE.Vector3(),
  }), []);

  useFrame(({ clock }, delta) => {
    const material = pointsRef.current?.material as THREE.ShaderMaterial | undefined;
    const parent = pointsRef.current?.parent;
    if (!material || !parent) return;

    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();

    const progress = useUniverseStore.getState().cinematicProgress;
    const visible = progress > 0.5 && progress < 0.985;
    const trailMaterial = trailRef.current?.material as THREE.LineBasicMaterial | undefined;
    pointsRef.current.visible = visible;
    if (trailRef.current) trailRef.current.visible = visible;
    if (!visible) {
      material.uniforms.uOpacity.value = 0;
      if (trailMaterial) trailMaterial.opacity = 0;
      return;
    }

    material.uniforms.uOpacity.value =
      THREE.MathUtils.smoothstep(progress, 0.52, 0.62) * (1 - THREE.MathUtils.smoothstep(progress, 0.9, 0.975));
    if (trailMaterial) trailMaterial.opacity = material.uniforms.uOpacity.value * 0.85;

    // The singularity in the astronaut's local space, so particles converge on
    // it even as the director moves and stretches the whole group.
    parent.updateWorldMatrix(true, false);
    scratch.inverse.copy(parent.matrixWorld).invert();
    scratch.bhLocal.set(0, 0, 0).applyMatrix4(scratch.inverse);
    const bx = scratch.bhLocal.x;
    const by = scratch.bhLocal.y;
    const bz = scratch.bhLocal.z;

    const arrive = THREE.MathUtils.clamp((progress - 0.58) / 0.34, 0, 1);
    const attribute = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    const trailAttribute = trailRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    const trailArray = trailAttribute?.array as Float32Array | undefined;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const seed = seeds[i];
      const k = THREE.MathUtils.clamp((arrive - seed * 0.2) / 0.8, 0, 1);
      const ease = k * k;

      let px = base[i3] + (bx - base[i3]) * ease;
      let py = base[i3 + 1] + (by - base[i3 + 1]) * ease;
      let pz = base[i3 + 2] + (bz - base[i3 + 2]) * ease;

      // Tangential swirl so the stream corkscrews instead of collapsing linearly.
      const rx = px - bx;
      const rz = pz - bz;
      const swirl = Math.sin(ease * Math.PI) * (0.25 + seed * 0.6);
      px += -rz * swirl;
      pz += rx * swirl;
      py += Math.sin(ease * Math.PI + seed * 6.0) * 0.22;

      array[i3] = px;
      array[i3 + 1] = py;
      array[i3 + 2] = pz;

      if (trailArray) {
        const dx = px - prev[i3];
        const dy = py - prev[i3 + 1];
        const dz = pz - prev[i3 + 2];
        const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const len = 0.05 + Math.min(speed * 22, 0.45);
        const scale = speed > 1e-6 ? len / speed : 0;
        const i6 = i * 6;
        trailArray[i6] = px;
        trailArray[i6 + 1] = py;
        trailArray[i6 + 2] = pz;
        trailArray[i6 + 3] = px - dx * scale;
        trailArray[i6 + 4] = py - dy * scale;
        trailArray[i6 + 5] = pz - dz * scale;
      }
      prev[i3] = px;
      prev[i3 + 1] = py;
      prev[i3 + 2] = pz;
    }
    attribute.needsUpdate = true;
    if (trailAttribute) trailAttribute.needsUpdate = true;
  });

  return (
    <>
      <lineSegments ref={trailRef} visible={false} renderOrder={4} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
      <points ref={pointsRef} visible={false} renderOrder={5} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
