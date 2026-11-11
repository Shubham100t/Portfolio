"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Soft, organic gas cloud. Each point is a large billowing puff built from
// per-particle fBm rather than a clean radial dot, so overlapping sprites read
// as continuous nebulosity instead of a field of fireflies.
const gasVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vSeed = aSeed;

    vec3 pos = position;
    float t = uTime;
    pos.x += sin(aSeed * 12.9898 + t * 0.12) * 0.14;
    pos.y += cos(aSeed * 7.233 + t * 0.10) * 0.16;
    pos.z += sin(aSeed * 3.170 + t * 0.08) * 0.12;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = aSize * (320.0 / max(-mv.z, 0.001)) * uPixelRatio;
    gl_PointSize = clamp(size, 2.0, 360.0 * uPixelRatio);

    vAlpha = 0.65 + 0.35 * sin(t * (0.25 + aSeed * 0.6) + aSeed * 40.0);
  }
`;

const gasFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vSeed;
  varying float vAlpha;

  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + 7.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;

    float soft = smoothstep(1.0, 0.05, r);

    // Rotate the internal structure per particle so puffs do not repeat.
    float ang = vSeed * 6.2831853;
    mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec2 rp = rot * p;

    float clump = fbm(rp * 2.4 + vSeed * 17.0 + uTime * 0.02);
    float structure = 0.30 + 1.05 * clump;
    float core = smoothstep(0.6, 0.0, r);

    vec3 col = vColor * (0.55 + 0.9 * clump);
    col += vColor * core * 0.7;

    float alpha = soft * structure * 0.06 * vAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize = clamp(aSize * (300.0 / max(-mv.z, 0.001)) * uPixelRatio, 1.0, 40.0 * uPixelRatio);
    vAlpha = 0.6 + 0.4 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 20.0);
  }
`;

const starFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p);
    if (d > 0.5) discard;
    float glow = exp(-d * d * 18.0);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export function Nebula() {
  const groupRef = useRef<THREE.Group>(null!);
  const gl = useThree((state) => state.gl);

  const gasUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const starUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );

  const gas = useMemo(() => {
    const count = 2800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    // Dense pillar filaments that sit inside the wider gas envelope.
    const curves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.7, -3.4, 0.1),
        new THREE.Vector3(-2.2, -1.3, -0.35),
        new THREE.Vector3(-2.65, 0.9, 0.12),
        new THREE.Vector3(-1.65, 3.65, 0.1),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, -3.6, -0.3),
        new THREE.Vector3(0.32, -1.55, 0.4),
        new THREE.Vector3(-0.1, 0.28, -0.16),
        new THREE.Vector3(0.78, 2.7, 0.3),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.25, -3.25, 0.1),
        new THREE.Vector3(1.88, -1.45, -0.25),
        new THREE.Vector3(2.55, 0.12, 0.22),
        new THREE.Vector3(2.18, 1.85, -0.14),
      ]),
    ];

    const indigo = new THREE.Color("#2a1b5e");
    const violet = new THREE.Color("#7c3aed");
    const magenta = new THREE.Color("#db2777");
    const cyan = new THREE.Color("#22d3ee");
    const gold = new THREE.Color("#f59e0b");
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const onPillar = Math.random() < 0.58;
      let x: number;
      let y: number;
      let z: number;
      let coreBias = 0;

      if (onPillar) {
        const curve = curves[Math.floor(Math.random() * curves.length)];
        const t = Math.random();
        const point = curve.getPoint(t);
        // Columns flare out toward their base (low t).
        const width = (0.25 + 0.9 * (1 - t)) * Math.pow(Math.random(), 0.5);
        const angle = Math.random() * Math.PI * 2;
        x = point.x + Math.cos(angle) * width;
        y = point.y + (Math.random() - 0.5) * width * 0.7;
        z = point.z + Math.sin(angle) * width * 0.8;
        coreBias = THREE.MathUtils.clamp(1.0 - width * 1.2, 0, 1);
      } else {
        // Broad ellipsoidal envelope so the cloud has soft outer volume.
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = Math.pow(Math.random(), 0.6);
        x = r * 3.9 * Math.sin(phi) * Math.cos(theta);
        y = r * 5.0 * Math.cos(phi);
        z = r * 2.6 * Math.sin(phi) * Math.sin(theta);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      color.copy(indigo).lerp(violet, 0.25 + Math.random() * 0.55);
      if (Math.random() < 0.34) color.lerp(cyan, Math.random() * 0.5);
      if (coreBias > 0.35 && Math.random() < coreBias * 0.8) {
        color.lerp(Math.random() < 0.55 ? magenta : gold, 0.55);
      }
      color.multiplyScalar(0.6 + Math.random() * 0.6);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = onPillar
        ? 1.1 + Math.random() * 1.8
        : 2.2 + Math.random() * 3.0;

      seeds[i] = Math.random();
    }

    return { positions, colors, sizes, seeds };
  }, []);

  const stars = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    const white = new THREE.Color("#f8fafc");
    const cyan = new THREE.Color("#93c5fd");
    const gold = new THREE.Color("#fde68a");
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Cluster young stars near the tops of the pillars.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * 3.4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 1.15 + 1.2;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.8;

      const roll = Math.random();
      color.copy(roll < 0.6 ? white : roll < 0.85 ? cyan : gold);
      color.multiplyScalar(0.8 + Math.random() * 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.22 + Math.random() * 0.6;
      seeds[i] = Math.random();
    }

    return { positions, colors, sizes, seeds };
  }, []);

  useFrame((_, delta) => {
    const pixelRatio = gl.getPixelRatio();
    gasUniforms.uTime.value += delta;
    gasUniforms.uPixelRatio.value = pixelRatio;
    starUniforms.uTime.value += delta;
    starUniforms.uPixelRatio.value = pixelRatio;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
      groupRef.current.rotation.z = Math.sin(gasUniforms.uTime.value * 0.08) * 0.03;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.05, -0.35, -0.06]}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gas.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[gas.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[gas.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[gas.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={gasVertexShader}
          fragmentShader={gasFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[stars.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[stars.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[stars.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={starUniforms}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
