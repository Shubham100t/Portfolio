"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// A 3D Einstein-Rosen funnel: an open cone whose wide mouth faces the approach
// (+Z) and narrows into darkness, a glowing aperture ring, and gas spiralling
// into the throat. Replacing a flat billboard gives real parallax and depth.

const tunnelVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const tunnelFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
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
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.02 + 5.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float ang = vUv.x * 6.2831853;
    // d = 0 at the wide mouth, 1 at the far throat
    float d = 1.0 - vUv.y;
    float t = uTime;

    float swirl = ang * 2.0 + d * 14.0 - t * 0.9;
    // Sample noise on a circle so it stays continuous across the cylinder seam.
    vec2 circ = vec2(cos(ang), sin(ang));
    float streak = fbm(circ * 3.0 + vec2(d * 9.0 - t * 0.45, d * 3.5 - t * 0.3));
    float bands = 0.5 + 0.5 * sin(swirl + streak * 6.0);
    // Eight faint flutes running wall-to-wall give the surface length.
    float flutes = pow(0.5 + 0.5 * cos(ang * 8.0 + d * 4.0 + streak * 1.5), 8.0);
    float intensity = smoothstep(0.12, 0.9, bands) * (0.3 + 0.7 * streak)
                    + flutes * 0.35 * (0.5 + 0.5 * streak);

    float mouth = exp(-d * 2.2);
    float farFade = 1.0 - smoothstep(0.68, 1.0, d);

    // Canonical wormhole palette: deep space-blue throat, electric cyan and
    // violet filaments, warm amber-gold light wrapping the mouth.
    vec3 deep = vec3(0.02, 0.03, 0.12);
    vec3 blue = vec3(0.08, 0.32, 0.95);
    vec3 cyan = vec3(0.15, 0.85, 1.0);
    vec3 violet = vec3(0.52, 0.24, 1.0);
    vec3 magenta = vec3(1.0, 0.28, 0.82);
    vec3 gold = vec3(1.0, 0.70, 0.22);
    vec3 warmWhite = vec3(1.0, 0.90, 0.66);

    float warm = smoothstep(0.0, 0.9, 1.0 - d);
    vec3 col = mix(deep, blue, warm * 0.9);
    col = mix(col, mix(violet, magenta, 0.5 + 0.5 * sin(swirl * 0.5 + 1.7)), bands * 0.32);
    col = mix(col, cyan, smoothstep(0.45, 1.0, streak) * (0.25 + 0.35 * warm));
    col = mix(col, gold, mouth * 0.85);
    col = mix(col, warmWhite, mouth * mouth * 0.45);
    // Keep gain below the additive clipping point so hue survives instead of
    // blowing out to pure white.
    col *= 0.32 + intensity * 1.2;

    float alpha = intensity * farFade * 0.9 + mouth * 0.22;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

// Soft aura inside the mouth so the aperture reads as luminous depth, not a
// hard geometric hoop. Deliberately diffuse: no distinct outer ring.
const haloVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uRing;
  uniform float uTime;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;

    // Broad, soft falloff instead of a thin bright band.
    float aura = exp(-pow((r - uRing * 0.8) * 4.2, 2.0));
    float core = exp(-pow(r * 1.9, 2.0)) * 0.35;
    float shimmer = 0.88 + 0.12 * sin(uTime * 2.0 + r * 9.0);

    vec3 col = mix(vec3(0.45, 0.72, 1.0), vec3(1.0, 0.68, 0.24), smoothstep(0.2, 0.6, r));
    float alpha = (aura * 0.34 + core) * shimmer;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const infallVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aRadius;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vFade;

  void main() {
    float life = fract(uTime * aSpeed + aSeed);
    float angle = aSeed * 6.2831853 + life * 10.0;
    float radius = mix(aRadius, 0.15, life);
    // Falls the full length of the stretched corridor into the singularity.
    float z = mix(3.9, -16.2, life);

    vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize = clamp(aSize * (280.0 / max(-mv.z, 0.001)) * uPixelRatio, 1.0, 22.0 * uPixelRatio);

    vColor = aColor;
    vFade = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.9, 1.0, life));
  }
`;

const infallFragmentShader = /* glsl */ `
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

// Opaque outer hull lathed around the funnel. Its normals face outward, so a
// front view culls it (the bore stays open) while side/back views see a solid,
// rim-lit portal instead of hollow floating geometry.
const shellVertexShader = /* glsl */ `
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

const shellFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
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
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = p * 2.03 + 3.7;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewDir);
    float facing = abs(dot(N, V));
    float rim = pow(1.0 - facing, 2.4);

    float ang = vUv.x * 6.2831853;
    float t = uTime;
    // uv.y runs pole -> mouth lip.
    float lip = smoothstep(0.4, 1.0, vUv.y);

    // Sample noise on the circumference so the seam never shows.
    vec2 circ = vec2(cos(ang), sin(ang));
    float patina = fbm(circ * 2.3 + vec2(vUv.y * 3.5 - t * 0.04, t * 0.025));

    // Iridescence drifts with the view angle instead of one flat blue body.
    float irid = 0.5 + 0.5 * sin(ang * 2.0 + facing * 7.0 + vUv.y * 8.0 - t * 0.35);

    vec3 deepIndigo = vec3(0.024, 0.018, 0.085);
    vec3 teal = vec3(0.028, 0.24, 0.36);
    vec3 violet = vec3(0.26, 0.10, 0.56);
    vec3 magenta = vec3(0.62, 0.13, 0.52);
    vec3 amber = vec3(1.0, 0.56, 0.16);

    vec3 skin = mix(deepIndigo, teal, smoothstep(0.22, 0.78, patina));
    skin = mix(skin, violet, irid * 0.6);
    skin = mix(skin, magenta, smoothstep(0.55, 1.0, patina) * (0.18 + 0.3 * irid));
    skin = mix(skin, amber, lip * (0.28 + 0.4 * patina));

    // Fine energy veins spiralling toward the lip.
    float veins = pow(0.5 + 0.5 * sin(ang * 6.0 + vUv.y * 26.0 - t * 0.85 + patina * 4.0), 10.0);
    vec3 veinColor = mix(vec3(0.25, 0.78, 1.0), vec3(1.0, 0.72, 0.28), lip);
    skin += veinColor * veins * (0.2 + rim * 1.5);

    // Fresnel rim: cold blue in the throat, violet grazing sheen, gold lip.
    vec3 rimColor = mix(vec3(0.16, 0.42, 1.0), vec3(1.0, 0.66, 0.24), lip);
    rimColor = mix(rimColor, vec3(0.78, 0.36, 1.0), irid * 0.5);
    skin += rimColor * rim * (0.85 + 0.45 * patina);

    // Faint wide sheen keeps the flanks from going pitch black.
    skin += vec3(0.55, 0.62, 0.85) * pow(facing, 2.5) * 0.045;

    gl_FragColor = vec4(skin, 1.0);
  }
`;

const MOUTH_Z = 3.5;
const MOUTH_RADIUS = 3.6;
const TUNNEL_DEPTH = 20;
const THROAT_Z = MOUTH_Z - TUNNEL_DEPTH;
const THROAT_RADIUS = 0.35;

// Hyperboloid of one sheet: the bore is narrowest at the throat and flares
// like a trumpet at the mouth. B is chosen so r(MOUTH_Z) === MOUTH_RADIUS.
const HYPER_B = TUNNEL_DEPTH / Math.sqrt((MOUTH_RADIUS / THROAT_RADIUS) ** 2 - 1);
const boreRadiusAt = (z: number) =>
  THROAT_RADIUS * Math.sqrt(1 + ((z - THROAT_Z) / HYPER_B) ** 2);

// Additive rim over the hull: only front-facing shell is drawn, so from the
// mouth this vanishes and side/back views get a soft glowing outline.
const shellGlowFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  uniform float uTime;

  void main() {
    float facing = abs(dot(normalize(vNormalView), normalize(vViewDir)));
    float rim = pow(1.0 - facing, 3.2);

    float ang = vUv.x * 6.2831853;
    float lip = smoothstep(0.25, 1.0, vUv.y);
    float hue = 0.5 + 0.5 * sin(ang * 3.0 + vUv.y * 7.0 - uTime * 0.5);

    vec3 cold = mix(vec3(0.18, 0.5, 1.0), vec3(0.72, 0.36, 1.0), hue);
    vec3 color = mix(cold, vec3(1.0, 0.70, 0.25), lip);
    float pulse = 0.8 + 0.2 * sin(uTime * 1.6 + vUv.y * 10.0);
    float alpha = rim * 0.55 * pulse;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Profile in (radius, z), ordered pole -> mouth lip so lathe normals point out.
// Samples are evenly spaced in z, which keeps LatheGeometry's index-based uv.y
// proportional to depth for the tunnel shader.
const PROFILE_SAMPLES = 48;

const BORE_PROFILE: [number, number][] = Array.from(
  { length: PROFILE_SAMPLES + 1 },
  (_, i) => {
    const z = THROAT_Z + (i / PROFILE_SAMPLES) * TUNNEL_DEPTH;
    return [boreRadiusAt(z), z] as [number, number];
  }
);

const SHELL_PROFILE: [number, number][] = (() => {
  const profile: [number, number][] = [
    // Rounded cap tucked behind the throat.
    [0.0, -17.5],
    [0.14, -17.45],
    [0.25, -17.36],
    [0.32, -17.24],
    [0.37, -17.1],
    [0.4, -16.95],
  ];
  for (let i = 0; i <= PROFILE_SAMPLES; i++) {
    const z = THROAT_Z + (i / PROFILE_SAMPLES) * TUNNEL_DEPTH;
    // The hull sits just outside the bore and thickens toward the flared mouth.
    profile.push([boreRadiusAt(z) + 0.34 + 0.12 * (i / PROFILE_SAMPLES), z]);
  }
  // Rounded lip closing over the mouth edge.
  profile.push([MOUTH_RADIUS + 0.5, MOUTH_Z + 0.06]);
  profile.push([MOUTH_RADIUS + 0.44, MOUTH_Z + 0.2]);
  profile.push([MOUTH_RADIUS + 0.3, MOUTH_Z + 0.28]);
  return profile;
})();

const RING_COUNT = 30;

/** Concentric hoops marching down the funnel. Their shrinking radius and
 * spacing are the strongest depth cue that this is a corridor, not a glow. */
function TunnelRings() {
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const rings = useMemo(() => {
    const palette = [
      new THREE.Color("#fbbf24"),
      new THREE.Color("#f59e0b"),
      new THREE.Color("#c084fc"),
      new THREE.Color("#818cf8"),
      new THREE.Color("#22d3ee"),
    ];
    return Array.from({ length: RING_COUNT }, (_, i) => {
      const depth = i / (RING_COUNT - 1);
      // Step evenly in radius rather than z: the flare would otherwise crowd
      // the hoops near the mouth and leave a gap before the throat.
      const bore = THREE.MathUtils.lerp(MOUTH_RADIUS, THROAT_RADIUS * 1.25, depth);
      const z = THROAT_Z + HYPER_B * Math.sqrt(Math.max((bore / THROAT_RADIUS) ** 2 - 1, 0));
      const radius = bore * 0.94;
      const tube = 0.05 - depth * 0.03;
      const color = palette[Math.min(palette.length - 1, Math.floor(depth * palette.length))];
      return { z, radius, tube, color, depth };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    materials.current.forEach((mat, i) => {
      if (!mat) return;
      const { depth } = rings[i];
      // A brightness wave travels down the tunnel, reinforcing the direction.
      mat.opacity = (0.6 - depth * 0.4) * (0.7 + 0.3 * Math.sin(t * 2.6 - depth * 5.0));
    });
  });

  return (
    <group>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 0, ring.z]} renderOrder={4}>
          <torusGeometry args={[ring.radius, ring.tube, 8, 96]} />
          <meshBasicMaterial
            ref={(mat) => {
              materials.current[i] = mat;
            }}
            color={ring.color}
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Wormhole() {
  const tunnelMat = useRef<THREE.ShaderMaterial>(null!);
  const singularityRef = useRef<THREE.Mesh>(null!);
  const gl = useThree((state) => state.gl);

  const tunnelUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const haloUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRing: { value: 0.625 } }),
    []
  );
  const infallUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const shellUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const shellGeometry = useMemo(
    () => new THREE.LatheGeometry(
      SHELL_PROFILE.map(([radius, z]) => new THREE.Vector2(radius, z)),
      96
    ),
    []
  );
  const boreGeometry = useMemo(
    () => new THREE.LatheGeometry(
      BORE_PROFILE.map(([radius, z]) => new THREE.Vector2(radius, z)),
      96
    ),
    []
  );

  const infall = useMemo(() => {
    const count = 700;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const gold = new THREE.Color("#fbbf24");
    const cyan = new THREE.Color("#38bdf8");
    const violet = new THREE.Color("#a78bfa");
    const white = new THREE.Color("#ffe9b8");
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      speeds[i] = 0.08 + Math.random() * 0.1;
      radii[i] = MOUTH_RADIUS * 0.55 + Math.random() * MOUTH_RADIUS * 0.45;
      sizes[i] = 0.18 + Math.random() * 0.5;

      const roll = Math.random();
      const tint = roll < 0.34 ? cyan : roll < 0.6 ? violet : roll < 0.88 ? gold : white;
      color.copy(tint);
      color.multiplyScalar(0.8 + Math.random() * 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, seeds, speeds, radii, sizes, colors };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    tunnelUniforms.uTime.value = t;
    haloUniforms.uTime.value = t;
    shellUniforms.uTime.value = t;
    infallUniforms.uTime.value = t;
    infallUniforms.uPixelRatio.value = gl.getPixelRatio();

    if (singularityRef.current) {
      singularityRef.current.scale.setScalar(1 + Math.sin(t * 2.1) * 0.16);
    }
  });

  return (
    <group rotation={[0.05, 0.12, 0]}>
      <pointLight color="#fbbf24" intensity={4} distance={18} position={[0, 0, MOUTH_Z]} />

      {/* Opaque lathe hull: invisible from straight ahead (normals face away),
          solid and rim-lit from the side/back. */}
      <mesh geometry={shellGeometry} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <shaderMaterial
          uniforms={shellUniforms}
          vertexShader={shellVertexShader}
          fragmentShader={shellFragmentShader}
        />
      </mesh>
      <mesh geometry={shellGeometry} rotation={[Math.PI / 2, 0, 0]} scale={1.012} renderOrder={2}>
        <shaderMaterial
          uniforms={shellUniforms}
          vertexShader={shellVertexShader}
          fragmentShader={shellGlowFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Funnel wall: hyperbolic flare that is wide at the mouth and vanishes
          into the throat. Lathed rather than conical so the silhouette curves. */}
      <mesh geometry={boreGeometry} rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
        <shaderMaterial
          ref={tunnelMat}
          uniforms={tunnelUniforms}
          vertexShader={tunnelVertexShader}
          fragmentShader={tunnelFragmentShader}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* The singularity the corridor empties into: a hot core with a soft
          additive halo so it reads as a distant point, not a wall. */}
      <mesh position={[0, 0, THROAT_Z + 0.2]} renderOrder={4}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color="#fff7d6" toneMapped={false} />
      </mesh>
      <mesh ref={singularityRef} position={[0, 0, THROAT_Z + 0.2]} renderOrder={4}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Depth hoops receding into the throat. */}
      <TunnelRings />

      {/* Diffuse luminous aura filling the mouth; no hard rim geometry. */}
      <mesh position={[0, 0, MOUTH_Z - 0.06]} renderOrder={3}>
        <planeGeometry args={[MOUTH_RADIUS * 3.2, MOUTH_RADIUS * 3.2]} />
        <shaderMaterial
          uniforms={haloUniforms}
          vertexShader={haloVertexShader}
          fragmentShader={haloFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gas spiralling into the throat. */}
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[infall.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[infall.seeds, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[infall.speeds, 1]} />
          <bufferAttribute attach="attributes-aRadius" args={[infall.radii, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[infall.sizes, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[infall.colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={infallUniforms}
          vertexShader={infallVertexShader}
          fragmentShader={infallFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
