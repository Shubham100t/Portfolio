"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

// Supernova remnant: a lumpy, filamentary ejecta shell wrapped around a hot
// synchrotron core. Three layers do the work:
//   1. large soft puffs  -> continuous nebulosity and volume
//   2. fine embers       -> sharp filaments and ejecta knots
//   3. core corona       -> the young compact object still burning inside

const puffVertexShader = /* glsl */ `
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
    // Slow outward drift sells an expanding remnant.
    float push = 0.04 + 0.03 * sin(aSeed * 9.0 + t * 0.25);
    pos *= 1.0 + push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = aSize * (320.0 / max(-mv.z, 0.001)) * uPixelRatio;
    gl_PointSize = clamp(size, 2.0, 300.0 * uPixelRatio);

    vAlpha = 0.6 + 0.4 * sin(t * (0.2 + aSeed * 0.5) + aSeed * 40.0);
  }
`;

const puffFragmentShader = /* glsl */ `
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

    float ang = vSeed * 6.2831853;
    mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec2 rp = rot * p;

    float clump = fbm(rp * 2.6 + vSeed * 17.0 + uTime * 0.015);
    float structure = 0.22 + 1.15 * clump;
    float core = smoothstep(0.6, 0.0, r);

    vec3 col = vColor * (0.5 + 0.95 * clump);
    col += vColor * core * 0.55;

    float alpha = soft * structure * 0.085 * vAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

const emberVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    vec3 pos = position * (1.0 + 0.035 + 0.025 * sin(aSeed * 7.0 + uTime * 0.3));
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize = clamp(aSize * (300.0 / max(-mv.z, 0.001)) * uPixelRatio, 1.0, 34.0 * uPixelRatio);

    vAlpha = 0.68 + 0.32 * sin(uTime * (0.9 + aSeed * 2.4) + aSeed * 30.0);
  }
`;

const emberFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p);
    if (d > 0.5) discard;
    float core = exp(-d * d * 34.0);
    float glow = exp(-d * d * 7.0) * 0.45;
    gl_FragColor = vec4(vColor, (core + glow) * vAlpha);
  }
`;

const coronaVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coronaFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float breathe = 0.85 + 0.15 * sin(uTime * 0.9);

    float core = exp(-r * r * 20.0);
    float halo = exp(-r * r * 4.0) * 0.45;
    float alpha = (core * 0.6 + halo * 0.5) * breathe;
    if (alpha < 0.01) discard;

    vec3 col = mix(vec3(0.30, 0.78, 1.0), vec3(1.0, 0.97, 0.88), core);
    gl_FragColor = vec4(col, alpha);
  }
`;

const SHELL_RADIUS = 4.9;

// Where the ejecta is compressed: a few broad bands over the sphere become
// visible filaments once particles are concentrated into them.
function filamentWeight(theta: number, phi: number) {
  const a = Math.sin(theta * 6.0 + phi * 3.0 + 0.8);
  const b = Math.sin(theta * 2.0 - phi * 5.0 + 2.1);
  return 0.22 + 0.78 * Math.pow(Math.abs(a * 0.6 + b * 0.4), 1.8);
}

/** Rejection-samples a direction whose density follows the filament bands. */
function sampleDirection() {
  for (let attempt = 0; attempt < 32; attempt++) {
    const theta = Math.random() * Math.PI * 2;
    const cosPhi = 2 * Math.random() - 1;
    const phi = Math.acos(cosPhi);
    if (Math.random() < filamentWeight(theta, phi)) return { theta, cosPhi };
  }
  return {
    theta: Math.random() * Math.PI * 2,
    cosPhi: 2 * Math.random() - 1,
  };
}

const deepOrange = new THREE.Color("#c2410c");
const orange = new THREE.Color("#fb923c");
const red = new THREE.Color("#fb7185");
const ember = new THREE.Color("#fde68a");
const cyan = new THREE.Color("#38bdf8");
const teal = new THREE.Color("#22d3ee");
const violet = new THREE.Color("#7c3aed");

function shellPoint(innerBias: boolean) {
  const { theta, cosPhi } = sampleDirection();
  const phi = Math.acos(cosPhi);

  const lump = 0.88 + 0.09 * Math.sin(phi * 3.0 + theta * 2.0)
             + 0.05 * Math.sin(theta * 5.0 - phi * 4.0);
  // Thin shell with a few knots flung further out.
  const thick = Math.random() < 0.12
    ? 1.18 + Math.random() * 0.24
    : 0.92 + Math.pow(Math.random(), 1.4) * 0.22;

  let radius = SHELL_RADIUS * lump * thick;
  if (innerBias && Math.random() < 0.16) {
    radius *= 0.4 + Math.random() * 0.45;
  }

  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  return {
    x: radius * sinPhi * Math.cos(theta),
    y: radius * cosPhi * 0.86,
    z: radius * sinPhi * Math.sin(theta),
    inner: radius < SHELL_RADIUS * 0.75,
  };
}

function ejectaColor(inner: boolean) {
  const color = new THREE.Color();
  const roll = Math.random();

  if (inner && roll < 0.6) {
    color.copy(roll < 0.3 ? cyan : teal);
  } else if (roll < 0.42) {
    color.copy(orange);
  } else if (roll < 0.7) {
    color.copy(red);
  } else if (roll < 0.88) {
    color.copy(deepOrange);
  } else {
    color.copy(ember);
  }

  if (!inner && Math.random() < 0.18) color.lerp(cyan, 0.4);
  if (Math.random() < 0.1) color.lerp(violet, 0.35);
  color.multiplyScalar(0.5 + Math.random() * 0.8);
  return color;
}

export function SupernovaRemnant() {
  const root = useRef<THREE.Group>(null!);
  const gl = useThree((state) => state.gl);

  const puffUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const emberUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const coronaUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const puffs = useMemo(() => {
    const count = 1300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const point = shellPoint(false);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      const color = ejectaColor(point.inner);
      color.multiplyScalar(0.55);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.2 + Math.random() * 2.0;
      seeds[i] = Math.random();
    }

    return { positions, colors, sizes, seeds };
  }, []);

  const embers = useMemo(() => {
    const count = 3400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const point = shellPoint(true);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      const color = ejectaColor(point.inner);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // A few bright knots per band; the rest are fine filament grains.
      sizes[i] = Math.random() < 0.07
        ? 0.4 + Math.random() * 0.4
        : 0.07 + Math.random() * 0.16;
      seeds[i] = Math.random();
    }

    return { positions, colors, sizes, seeds };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    puffUniforms.uTime.value = t;
    emberUniforms.uTime.value = t;
    coronaUniforms.uTime.value = t;

    const pixelRatio = gl.getPixelRatio();
    puffUniforms.uPixelRatio.value = pixelRatio;
    emberUniforms.uPixelRatio.value = pixelRatio;

    if (root.current) {
      root.current.rotation.y += delta * 0.03;
      root.current.rotation.z = -0.42 + Math.sin(t * 0.23) * 0.03;
      root.current.scale.setScalar(1 + Math.sin(t * 0.42) * 0.018);
    }
  });

  return (
    <group ref={root} rotation={[0.16, -0.4, -0.42]}>
      <pointLight color="#fb923c" intensity={3} distance={16} />

      {/* Hot compact object still burning at the centre. */}
      <Billboard>
        <mesh renderOrder={2}>
          <planeGeometry args={[2.8, 2.8]} />
          <shaderMaterial
            uniforms={coronaUniforms}
            vertexShader={coronaVertexShader}
            fragmentShader={coronaFragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshBasicMaterial color="#eaf6ff" toneMapped={false} />
      </mesh>
      <pointLight color="#67e8f9" intensity={4} distance={8} />

      {/* Volume: soft luminous gas. */}
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[puffs.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[puffs.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[puffs.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[puffs.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={puffUniforms}
          vertexShader={puffVertexShader}
          fragmentShader={puffFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Structure: sharp filaments and ejecta knots. */}
      <points frustumCulled={false} renderOrder={4}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[embers.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[embers.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[embers.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[embers.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={emberUniforms}
          vertexShader={emberVertexShader}
          fragmentShader={emberFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
