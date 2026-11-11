"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

// A millisecond pulsar: a tiny hot neutron star, a thin equatorial belt of
// orbiting plasma, and two magnetically-tilted polar jets that pulse as the
// star spins. Everything that moves is driven by uTime so the sweep reads as
// one object instead of independent props.

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
    float pulse = 0.72 + 0.28 * sin(uTime * 3.2);

    float core = exp(-r * r * 26.0);
    float halo = exp(-r * r * 5.5) * 0.5;
    float alpha = (core * 0.9 + halo * 0.45) * pulse;
    if (alpha < 0.01) discard;

    vec3 col = mix(vec3(0.70, 0.60, 1.0), vec3(0.96, 0.98, 1.0), core);
    gl_FragColor = vec4(col, alpha);
  }
`;

const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform float uFlip;

  void main() {
    // along = 0 at the star, 1 at the beam tip.
    float along = mix(vUv.y, 1.0 - vUv.y, uFlip);
    float body = smoothstep(0.0, 0.06, along) * (1.0 - smoothstep(0.42, 1.0, along));

    float ang = vUv.x * 6.2831853;
    float streak = 0.5 + 0.5 * sin(ang * 7.0 + along * 16.0 - uTime * 4.0);
    float flicker = 0.5 + 0.5 * sin(ang * 13.0 - along * 26.0 + uTime * 6.0);
    float filaments = pow(streak, 7.0) * 0.65 + pow(flicker, 12.0) * 0.35;

    float facing = abs(dot(normalize(vNormalView), normalize(vViewDir)));
    float edge = pow(1.0 - facing, 1.6);
    float pulse = 0.7 + 0.3 * sin(uTime * 3.2);

    vec3 hot = vec3(0.86, 0.94, 1.0);
    vec3 cyan = vec3(0.30, 0.80, 1.0);
    vec3 violet = vec3(0.55, 0.36, 1.0);
    vec3 col = mix(hot, cyan, smoothstep(0.0, 0.3, along));
    col = mix(col, violet, smoothstep(0.35, 1.0, along));

    float alpha = body * (0.05 + filaments * 0.4) * (0.45 + 0.85 * edge) * pulse;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const jetVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSide;
  attribute float aSpeed;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vFade;

  void main() {
    float life = fract(uTime * aSpeed + aSeed);
    float angle = aSeed * 6.2831853 + life * (6.0 + aSeed * 4.0);
    float radius = 0.06 + life * (0.22 + aSeed * 0.75);
    float y = aSide * (0.55 + life * 5.0);

    vec3 p = vec3(cos(angle) * radius, y, sin(angle) * radius);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize = clamp(aSize * (300.0 / max(-mv.z, 0.001)) * uPixelRatio, 1.0, 18.0 * uPixelRatio);

    vColor = aColor;
    vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life));
  }
`;

const jetFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vFade;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p);
    if (d > 0.5) discard;
    float glow = exp(-d * d * 16.0);
    gl_FragColor = vec4(vColor, vFade * glow);
  }
`;

const diskVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vFade;

  void main() {
    float angle = aSeed * 6.2831853 + uTime * aSpeed;
    float jitter = fract(sin(aSeed * 91.7) * 43758.5453) - 0.5;
    vec3 p = vec3(cos(angle) * aRadius, jitter * 0.12, sin(angle) * aRadius);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize = clamp(aSize * (300.0 / max(-mv.z, 0.001)) * uPixelRatio, 1.0, 14.0 * uPixelRatio);

    vColor = aColor;
    vFade = 0.55 + 0.45 * sin(uTime * (1.0 + aSeed) + aSeed * 20.0);
  }
`;

const diskFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vFade;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p);
    if (d > 0.5) discard;
    float glow = exp(-d * d * 18.0);
    gl_FragColor = vec4(vColor, vFade * glow);
  }
`;

const JET_HEIGHT = 5.0;
const JET_BASE_Y = 0.55;

export function Pulsar() {
  const root = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const coreLight = useRef<THREE.PointLight>(null!);
  const gl = useThree((state) => state.gl);

  const coronaUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const beamUniforms = useMemo(
    () => [
      { uTime: { value: 0 }, uFlip: { value: 0 } },
      { uTime: { value: 0 }, uFlip: { value: 1 } },
    ],
    []
  );
  const jetUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const diskUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );

  const jets = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sides = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const white = new THREE.Color("#e0f2fe");
    const cyan = new THREE.Color("#38bdf8");
    const violet = new THREE.Color("#a78bfa");
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sides[i] = i % 2 === 0 ? 1 : -1;
      speeds[i] = 0.16 + Math.random() * 0.22;
      sizes[i] = 0.12 + Math.random() * 0.24;

      const roll = Math.random();
      color.copy(roll < 0.32 ? white : roll < 0.74 ? cyan : violet);
      color.multiplyScalar(0.7 + Math.random() * 0.55);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, seeds, sides, speeds, sizes, colors };
  }, []);

  const disk = useMemo(() => {
    const count = 700;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const cyan = new THREE.Color("#67e8f9");
    const violet = new THREE.Color("#a78bfa");
    const gold = new THREE.Color("#fde68a");
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      radii[i] = 1.35 + Math.pow(Math.random(), 1.4) * 0.62;
      // Roughly Keplerian: inner gas laps the star faster than the rim.
      speeds[i] = 1.9 - radii[i] * 0.45 + Math.random() * 0.35;
      sizes[i] = 0.08 + Math.random() * 0.18;

      const roll = Math.random();
      color.copy(roll < 0.58 ? cyan : roll < 0.9 ? violet : gold);
      color.multiplyScalar(0.65 + Math.random() * 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, seeds, radii, speeds, sizes, colors };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    coronaUniforms.uTime.value = t;
    beamUniforms[0].uTime.value = t;
    beamUniforms[1].uTime.value = t;
    jetUniforms.uTime.value = t;
    diskUniforms.uTime.value = t;

    const pixelRatio = gl.getPixelRatio();
    jetUniforms.uPixelRatio.value = pixelRatio;
    diskUniforms.uPixelRatio.value = pixelRatio;

    if (root.current) root.current.rotation.y = t * 0.22;
    if (coreRef.current) coreRef.current.scale.setScalar(1 + Math.sin(t * 3.2) * 0.06);
    if (coreLight.current) coreLight.current.intensity = 9 + Math.sin(t * 3.2) * 3;
  });

  return (
    <group ref={root}>
      <group rotation={[0.26, 0, 0.38]}>
        <pointLight ref={coreLight} color="#c4b5fd" intensity={9} distance={20} />

        {/* Pulsing corona billboard: reads as the star's own light bloom. */}
        <Billboard>
          <mesh renderOrder={4}>
            <planeGeometry args={[3.4, 3.4]} />
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

        {/* Hot neutron-star core. */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshBasicMaterial color="#f2eeff" toneMapped={false} />
        </mesh>

        {/* Equatorial plasma belt: orbiting particles plus one thin ring. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
          <torusGeometry args={[1.55, 0.012, 8, 128]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <points frustumCulled={false} renderOrder={3}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[disk.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[disk.seeds, 1]} />
            <bufferAttribute attach="attributes-aRadius" args={[disk.radii, 1]} />
            <bufferAttribute attach="attributes-aSpeed" args={[disk.speeds, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[disk.sizes, 1]} />
            <bufferAttribute attach="attributes-aColor" args={[disk.colors, 3]} />
          </bufferGeometry>
          <shaderMaterial
            uniforms={diskUniforms}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Twin polar jets on the tilted magnetic axis. */}
        <group rotation={[0, 0, 0.22]}>
          {[1, -1].map((side, index) => (
            <group key={side}>
              <mesh
                position={[0, side * (JET_BASE_Y + JET_HEIGHT / 2), 0]}
                rotation={side > 0 ? [0, 0, 0] : [Math.PI, 0, 0]}
                renderOrder={2}
              >
                <cylinderGeometry args={[1.0, 0.06, JET_HEIGHT, 32, 24, true]} />
                <shaderMaterial
                  uniforms={beamUniforms[index]}
                  vertexShader={beamVertexShader}
                  fragmentShader={beamFragmentShader}
                  side={THREE.DoubleSide}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>
          ))}

          <points frustumCulled={false} renderOrder={3}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[jets.positions, 3]} />
              <bufferAttribute attach="attributes-aSeed" args={[jets.seeds, 1]} />
              <bufferAttribute attach="attributes-aSide" args={[jets.sides, 1]} />
              <bufferAttribute attach="attributes-aSpeed" args={[jets.speeds, 1]} />
              <bufferAttribute attach="attributes-aSize" args={[jets.sizes, 1]} />
              <bufferAttribute attach="attributes-aColor" args={[jets.colors, 3]} />
            </bufferGeometry>
            <shaderMaterial
              uniforms={jetUniforms}
              vertexShader={jetVertexShader}
              fragmentShader={jetFragmentShader}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
      </group>
    </group>
  );
}
