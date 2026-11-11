"use client";

import React, { useRef, useMemo, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { TidalSheath } from "./TidalSheath";
import { AstronautDissolve } from "./AstronautDissolve";
import { AstronautDebris } from "./AstronautDebris";

// Gold mirror visor. Scene lighting is faked: a deep bronze base, a slow warm
// reflection band dragged across the glass, a fixed cool glint and a gold
// fresnel edge keep the helmet readable against the bright accretion disk.
const visorVertexShader = /* glsl */ `
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

const visorFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uHeat;

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewDir);
    float fres = pow(1.0 - abs(dot(N, V)), 2.2);

    // Bronze mirror deepens toward the chin, warms toward the crown.
    vec3 bronze = mix(vec3(0.03, 0.016, 0.006), vec3(0.19, 0.105, 0.022), smoothstep(0.05, 0.95, vUv.y));
    vec3 col = bronze;

    // Slow reflection slab sliding diagonally across the visor.
    float slab = smoothstep(0.34, 0.0, abs(vUv.y - 0.58 - 0.14 * sin(uTime * 0.16 + vUv.x * 2.4)));
    col += vec3(1.0, 0.66, 0.2) * slab * 0.5;

    // Tight cool glint, as if a distant star sits just off the glass.
    float glint = pow(max(0.0, dot(N, normalize(vec3(-0.32, 0.72, 0.6)))), 22.0);
    col += vec3(0.72, 0.84, 1.0) * glint * 1.1;

    col += vec3(1.0, 0.71, 0.26) * fres * 1.25;

    // Tidal heating: the visor scorches from the edges inward as the suit
    // starts to come apart.
    col += vec3(1.0, 0.5, 0.16) * uHeat * fres * 1.6;

    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * BasicAstronaut
 * Wrapped with forwardRef so CinematicDirector can GSAP-animate the outer group
 * (world position / rotation) while the inner zero-G float animation runs additively.
 */
export const BasicAstronaut = forwardRef<THREE.Group>(function BasicAstronaut(_props, ref) {
  const innerRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const fillLightRef = useRef<THREE.PointLight>(null!);
  const { camera } = useThree();
  const cinematicProgress = useUniverseStore((state) => state.cinematicProgress);
  const astronautWorldPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraToAstronaut = useMemo(() => new THREE.Vector3(), []);
  const closestApproach = useMemo(() => new THREE.Vector3(), []);

  const visorUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 }, uHeat: { value: 0 } }),
    []
  );
  const heatTint = useMemo(() => new THREE.Color("#ff7a2f"), []);
  const fillCold = useMemo(() => new THREE.Color("#ffe2b0"), []);
  const fillHot = useMemo(() => new THREE.Color("#ff9a52"), []);

  const hoseGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 1.02, -0.46),
      new THREE.Vector3(0.56, 0.96, -0.34),
      new THREE.Vector3(0.6, 0.74, -0.12),
      new THREE.Vector3(0.46, 0.62, 0.22),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.032, 8, false);
  }, []);

  // Memoized PBR materials
  const mats = useMemo(() => {
    const materials = {
      suitWhite: new THREE.MeshStandardMaterial({ color: "#eef2f7", roughness: 0.55, metalness: 0.08 }),
      suitPanel: new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5, metalness: 0.18 }),
      joint: new THREE.MeshStandardMaterial({ color: "#16202e", roughness: 0.75, metalness: 0.35 }),
      steel: new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.28, metalness: 0.9 }),
      trim: new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.32, metalness: 0.65, emissive: "#b45309", emissiveIntensity: 0.45 }),
      accent: new THREE.MeshStandardMaterial({ color: "#1e40af", roughness: 0.42, metalness: 0.3, emissive: "#0a1a4a", emissiveIntensity: 0.35 }),
      screen: new THREE.MeshStandardMaterial({ color: "#0b1220", roughness: 0.35, metalness: 0.4, emissive: "#22d3ee", emissiveIntensity: 1.1 }),
      ledCyan: new THREE.MeshBasicMaterial({ color: "#38bdf8" }),
      ledGreen: new THREE.MeshBasicMaterial({ color: "#4ade80" }),
      ledAmber: new THREE.MeshBasicMaterial({ color: "#fbbf24" }),
      lamp: new THREE.MeshBasicMaterial({ color: "#fff7e6" }),
      beacon: new THREE.MeshBasicMaterial({ color: "#ff5050", toneMapped: false }),
    };
    // Alpha-blended from the start so the spaghettification fade never triggers a
    // mid-prologue shader recompile. Opacity stays at 1 until the tide hits.
    Object.values(materials).forEach((material) => {
      material.transparent = true;
    });
    return materials;
  }, []);
  const matList = useMemo(() => Object.values(mats), [mats]);
  const heatMats = useMemo(
    () => [mats.suitWhite, mats.suitPanel, mats.joint, mats.steel, mats.trim, mats.accent],
    [mats]
  );
  const heatBaseline = useMemo(
    () =>
      heatMats.map((material) => ({
        emissive: material.emissive.clone(),
        intensity: material.emissiveIntensity,
      })),
    [heatMats]
  );

  // Zero-gravity harmonic floating — additive on top of GSAP-driven outer group
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    visorUniforms.uTime.value += delta;
    mats.screen.emissiveIntensity = 0.95 + 0.35 * Math.sin(t * 2.1);
    const beaconPulse = Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 6);
    mats.beacon.color.setRGB(0.45 + beaconPulse * 1.4, 0.05 + beaconPulse * 0.32, 0.05 + beaconPulse * 0.32);
    const sway = useUniverseStore.getState().reducedMotion ? 0 : 1;
    if (innerRef.current) {
      innerRef.current.position.y = Math.sin(t * 0.8) * 0.07 * sway;
      innerRef.current.position.x = Math.cos(t * 0.6) * 0.04 * sway;
      innerRef.current.rotation.x = Math.sin(t * 0.4) * 0.05 * sway;
      innerRef.current.rotation.y = Math.cos(t * 0.3) * 0.08 * sway;
      innerRef.current.rotation.z = Math.sin(t * 0.25) * 0.04 * sway;

      // Lens only the astronaut image when Gargantua lies directly between it
      // and the viewer. This is a restrained visual approximation of strong
      // lensing, not physical stretching of the astronaut's body.
      innerRef.current.getWorldPosition(astronautWorldPosition);
      cameraToAstronaut.copy(astronautWorldPosition).sub(camera.position);
      const astronautDistance = cameraToAstronaut.length();
      cameraToAstronaut.normalize();
      const blackHoleDepth = camera.position.clone().negate().dot(cameraToAstronaut);
      closestApproach.copy(camera.position).addScaledVector(cameraToAstronaut, blackHoleDepth);
      const impactParameter = closestApproach.length();
      const isBehindHorizon = blackHoleDepth > 0 && astronautDistance > blackHoleDepth;
      const lensStrength = isBehindHorizon
        ? (1.0 - THREE.MathUtils.smoothstep(0.8, 3.1, impactParameter)) * 0.42
        : 0;
      // Tidal spaghettification during the prologue. Timing matches the
      // dissolve particles: the body elongates from roughly t=17s, then the
      // suit shreds and the sparks carry the silhouette into the singularity.
      const cinematicWarp = THREE.MathUtils.smoothstep(cinematicProgress, 0.36, 0.60) * 0.62;
      const distortion = Math.max(lensStrength, cinematicWarp);
      innerRef.current.scale.set(1.0 - distortion * 0.52, 1.0 + distortion * 1.3, 1.0 - distortion * 0.52);
      // A slow strain rather than a shiver: the body is being drawn out, not
      // vibrating.
      innerRef.current.rotation.z += Math.sin(t * 0.9) * distortion * 0.07 * sway;

      // Tidal heating. Suit panels and joints glow before the visible stretch,
      // selling the build-up rather than having the body snap into a shape.
      const heat = THREE.MathUtils.smoothstep(cinematicProgress, 0.30, 0.58);
      const heatPulse = 0.9 + 0.1 * Math.sin(t * 5.0);
      for (let i = 0; i < heatMats.length; i++) {
        heatMats[i].emissive.copy(heatBaseline[i].emissive).lerp(heatTint, heat);
        heatMats[i].emissiveIntensity = heatBaseline[i].intensity + heat * 0.55 * heatPulse;
      }
      visorUniforms.uHeat.value = heat;
      if (fillLightRef.current) {
        fillLightRef.current.intensity = 0.5 + heat * 5.5;
        fillLightRef.current.distance = 2.6 + heat * 2.6;
        fillLightRef.current.color.copy(fillCold).lerp(fillHot, heat);
      }

      const dissolve = THREE.MathUtils.smoothstep(cinematicProgress, 0.55, 0.66);
      visorUniforms.uOpacity.value = 1 - dissolve;
      for (const material of matList) {
        material.opacity = 1 - dissolve;
      }
      // Once the suit is gone the sparks own the silhouette; hiding the body
      // also stops its depth writes from hiding particles funneling past it.
      if (bodyRef.current) bodyRef.current.visible = dissolve < 0.995;
    }
  });

  return (
    // Outer group: controlled by CinematicDirector via forwardRef
    <group ref={ref}>
      {/* Inner group: zero-G float animation */}
      <group ref={innerRef}>
        <TidalSheath />
        <AstronautDissolve />
        <AstronautDebris />
        {/* Suit body: fades out as the sparks take over. */}
        <group ref={bodyRef}>
        {/* --- HEAD & HELMET --- */}
        <group position={[0, 1.45, 0]}>
          <mesh material={mats.suitWhite}>
            <sphereGeometry args={[0.4, 32, 32]} />
          </mesh>
          <mesh position={[0, 0.03, 0.2]} rotation={[0.1, 0, 0]}>
            <sphereGeometry args={[0.315, 32, 24, 0, Math.PI, 0, Math.PI * 0.66]} />
            <shaderMaterial
              uniforms={visorUniforms}
              vertexShader={visorVertexShader}
              fragmentShader={visorFragmentShader}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
          {/* Ear pods + top lamp give the helmet a hard-surface read. */}
          <mesh position={[0.39, 0, 0.02]} rotation={[0, 0, Math.PI / 2]} material={mats.steel}>
            <cylinderGeometry args={[0.1, 0.11, 0.08, 20]} />
          </mesh>
          <mesh position={[-0.39, 0, 0.02]} rotation={[0, 0, Math.PI / 2]} material={mats.steel}>
            <cylinderGeometry args={[0.1, 0.11, 0.08, 20]} />
          </mesh>
          <mesh position={[0, 0.33, 0.18]} rotation={[0.55, 0, 0]} material={mats.joint}>
            <cylinderGeometry args={[0.055, 0.065, 0.12, 16]} />
          </mesh>
          <mesh position={[0, 0.385, 0.214]} rotation={[0.55, 0, 0]} material={mats.lamp}>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 16]} />
          </mesh>
          {/* Neck rings */}
          <mesh position={[0, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
            <torusGeometry args={[0.29, 0.035, 12, 40]} />
          </mesh>
          <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.joint}>
            <torusGeometry args={[0.31, 0.045, 12, 40]} />
          </mesh>
        </group>

        {/* --- TORSO & CHEST PACK --- */}
        <group position={[0, 0.72, 0]}>
          <mesh material={mats.suitWhite}>
            <capsuleGeometry args={[0.35, 0.58, 12, 28]} />
          </mesh>
          {/* Shoulder straps */}
          <mesh position={[0.17, 0.3, 0.27]} rotation={[-0.14, 0, 0.06]} material={mats.joint}>
            <boxGeometry args={[0.1, 0.42, 0.05]} />
          </mesh>
          <mesh position={[-0.17, 0.3, 0.27]} rotation={[-0.14, 0, -0.06]} material={mats.joint}>
            <boxGeometry args={[0.1, 0.42, 0.05]} />
          </mesh>
          {/* Chest control unit */}
          <mesh position={[0, 0.1, 0.295]} material={mats.accent}>
            <boxGeometry args={[0.48, 0.4, 0.1]} />
          </mesh>
          <mesh position={[0, 0.1, 0.33]} material={mats.steel}>
            <boxGeometry args={[0.42, 0.34, 0.13]} />
          </mesh>
          <mesh position={[0, 0.14, 0.4]} material={mats.screen}>
            <boxGeometry args={[0.2, 0.1, 0.015]} />
          </mesh>
          <mesh position={[-0.13, 0.02, 0.4]} material={mats.ledCyan}>
            <boxGeometry args={[0.04, 0.04, 0.012]} />
          </mesh>
          <mesh position={[-0.05, 0.02, 0.4]} material={mats.ledGreen}>
            <boxGeometry args={[0.04, 0.04, 0.012]} />
          </mesh>
          <mesh position={[0.06, 0.02, 0.4]} material={mats.ledAmber}>
            <boxGeometry args={[0.08, 0.04, 0.012]} />
          </mesh>
          {/* Waist belt */}
          <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.joint}>
            <torusGeometry args={[0.35, 0.05, 12, 40]} />
          </mesh>
          <mesh position={[0, -0.4, 0.34]} material={mats.trim}>
            <boxGeometry args={[0.14, 0.1, 0.05]} />
          </mesh>
        </group>

        {/* --- PLSS BACKPACK (Life Support) --- */}
        <group position={[0, 0.78, -0.45]}>
          <mesh material={mats.suitPanel}>
            <boxGeometry args={[0.74, 0.96, 0.34]} />
          </mesh>
          <mesh position={[0, 0.56, 0.02]} material={mats.accent}>
            <boxGeometry args={[0.52, 0.13, 0.28]} />
          </mesh>
          {/* Ribbed heat-exchanger face */}
          {[0.22, 0.02, -0.18].map((y) => (
            <mesh key={y} position={[0, y, -0.178]} material={mats.steel}>
              <boxGeometry args={[0.62, 0.035, 0.02]} />
            </mesh>
          ))}
          {/* Antenna + strobe break the silhouette from behind */}
          <mesh position={[0.28, 0.64, -0.12]} material={mats.steel}>
            <cylinderGeometry args={[0.012, 0.018, 0.5, 8]} />
          </mesh>
          <mesh position={[0.28, 0.9, -0.12]} material={mats.beacon}>
            <sphereGeometry args={[0.04, 12, 12]} />
          </mesh>
          {/* Twin O2 tanks */}
          {[0.2, -0.2].map((x) => (
            <group key={x} position={[x, 0.12, -0.24]}>
              <mesh material={mats.steel}>
                <cylinderGeometry args={[0.09, 0.09, 0.4, 16]} />
              </mesh>
              <mesh position={[0, 0.2, 0]} material={mats.steel}>
                <sphereGeometry args={[0.09, 16, 12]} />
              </mesh>
            </group>
          ))}
          {/* Cooling vent strip */}
          <mesh position={[0, -0.42, -0.18]} material={mats.ledCyan}>
            <boxGeometry args={[0.5, 0.025, 0.02]} />
          </mesh>
          <mesh position={[0.26, 0.5, -0.12]} material={mats.joint}>
            <cylinderGeometry args={[0.05, 0.065, 0.14, 14]} />
          </mesh>
          <mesh position={[-0.26, 0.5, -0.12]} material={mats.joint}>
            <cylinderGeometry args={[0.05, 0.065, 0.14, 14]} />
          </mesh>
        </group>

        {/* O2 hose: backpack to chest */}
        <mesh geometry={hoseGeometry} material={mats.joint} />

        {/* --- LEFT ARM --- */}
        <group position={[-0.5, 1.05, 0]} rotation={[0.18, 0, 0.3]}>
          <mesh material={mats.joint}>
            <sphereGeometry args={[0.16, 20, 20]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} scale={[1.08, 0.78, 1.08]} material={mats.accent}>
            <sphereGeometry args={[0.175, 20, 16]} />
          </mesh>
          <mesh position={[0, -0.28, 0]} material={mats.suitPanel}>
            <capsuleGeometry args={[0.115, 0.3, 8, 16]} />
          </mesh>
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.accent}>
            <torusGeometry args={[0.122, 0.024, 10, 24]} />
          </mesh>
          {/* Mission patch */}
          <mesh position={[-0.12, -0.2, 0.02]} material={mats.ledCyan}>
            <boxGeometry args={[0.012, 0.09, 0.09]} />
          </mesh>
          <group position={[0, -0.52, 0]} rotation={[0.06, 0, 0]}>
            <mesh material={mats.joint}>
              <sphereGeometry args={[0.115, 16, 16]} />
            </mesh>
            <group position={[0, -0.06, 0.02]} rotation={[0.38, 0, 0]}>
              <mesh position={[0, -0.18, 0]} material={mats.suitPanel}>
                <capsuleGeometry args={[0.105, 0.26, 8, 16]} />
              </mesh>
              <mesh position={[0, -0.33, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
                <torusGeometry args={[0.105, 0.018, 10, 20]} />
              </mesh>
              <mesh position={[0, -0.42, 0.02]} material={mats.joint}>
                <sphereGeometry args={[0.1, 16, 16]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* --- RIGHT ARM --- */}
        <group position={[0.5, 1.05, 0]} rotation={[0.18, 0, -0.3]}>
          <mesh material={mats.joint}>
            <sphereGeometry args={[0.16, 20, 20]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} scale={[1.08, 0.78, 1.08]} material={mats.accent}>
            <sphereGeometry args={[0.175, 20, 16]} />
          </mesh>
          <mesh position={[0, -0.28, 0]} material={mats.suitPanel}>
            <capsuleGeometry args={[0.115, 0.3, 8, 16]} />
          </mesh>
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.accent}>
            <torusGeometry args={[0.122, 0.024, 10, 24]} />
          </mesh>
          {/* Commander stripe */}
          <mesh position={[0.115, -0.28, 0]} material={mats.trim}>
            <boxGeometry args={[0.018, 0.28, 0.13]} />
          </mesh>
          <group position={[0, -0.52, 0]} rotation={[0.06, 0, 0]}>
            <mesh material={mats.joint}>
              <sphereGeometry args={[0.115, 16, 16]} />
            </mesh>
            <group position={[0, -0.06, 0.02]} rotation={[0.32, 0, 0]}>
              <mesh position={[0, -0.18, 0]} material={mats.suitPanel}>
                <capsuleGeometry args={[0.105, 0.26, 8, 16]} />
              </mesh>
              <mesh position={[0, -0.33, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
                <torusGeometry args={[0.105, 0.018, 10, 20]} />
              </mesh>
              <mesh position={[0, -0.42, 0.02]} material={mats.joint}>
                <sphereGeometry args={[0.1, 16, 16]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* --- HIPS & WAIST --- */}
        <group position={[0, 0.16, 0]}>
          <mesh material={mats.joint}>
            <cylinderGeometry args={[0.35, 0.34, 0.26, 24]} />
          </mesh>
        </group>

        {/* --- LEFT LEG --- */}
        <group position={[-0.2, 0.05, 0]}>
          <mesh position={[0, -0.3, 0.02]} rotation={[-0.05, 0, 0.04]} material={mats.suitPanel}>
            <capsuleGeometry args={[0.145, 0.4, 8, 16]} />
          </mesh>
          <mesh position={[-0.147, -0.3, 0.02]} rotation={[-0.05, 0, 0.04]} material={mats.accent}>
            <boxGeometry args={[0.02, 0.32, 0.16]} />
          </mesh>
          <group position={[0.02, -0.6, 0.08]}>
            <mesh material={mats.joint}>
              <sphereGeometry args={[0.135, 16, 16]} />
            </mesh>
            <group position={[0.02, -0.06, 0.02]} rotation={[0.2, 0, 0]}>
              <mesh position={[0, -0.2, 0]} material={mats.suitPanel}>
                <capsuleGeometry args={[0.125, 0.28, 8, 16]} />
              </mesh>
              <mesh position={[0, -0.37, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
                <torusGeometry args={[0.125, 0.02, 10, 20]} />
              </mesh>
              <mesh position={[0, -0.46, 0.08]} material={mats.joint}>
                <boxGeometry args={[0.2, 0.16, 0.36]} />
              </mesh>
              <mesh position={[0, -0.5, 0.2]} material={mats.steel}>
                <boxGeometry args={[0.18, 0.06, 0.14]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* --- RIGHT LEG --- */}
        <group position={[0.2, 0.05, 0]}>
          <mesh position={[0, -0.3, -0.01]} rotation={[0.04, 0, -0.04]} material={mats.suitPanel}>
            <capsuleGeometry args={[0.145, 0.4, 8, 16]} />
          </mesh>
          <mesh position={[0.147, -0.3, -0.01]} rotation={[0.04, 0, -0.04]} material={mats.accent}>
            <boxGeometry args={[0.02, 0.32, 0.16]} />
          </mesh>
          <group position={[-0.01, -0.6, 0.04]}>
            <mesh material={mats.joint}>
              <sphereGeometry args={[0.135, 16, 16]} />
            </mesh>
            <group position={[-0.02, -0.06, 0.02]} rotation={[0.14, 0, 0]}>
              <mesh position={[0, -0.2, 0]} material={mats.suitPanel}>
                <capsuleGeometry args={[0.125, 0.28, 8, 16]} />
              </mesh>
              <mesh position={[0, -0.37, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
                <torusGeometry args={[0.125, 0.02, 10, 20]} />
              </mesh>
              <mesh position={[0, -0.46, 0.06]} material={mats.joint}>
                <boxGeometry args={[0.2, 0.16, 0.36]} />
              </mesh>
              <mesh position={[0, -0.5, 0.18]} material={mats.steel}>
                <boxGeometry args={[0.18, 0.06, 0.14]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Warm fill so the white suit separates from Gargantua's glare. */}
        <pointLight ref={fillLightRef} position={[0.5, 1.7, 1.1]} color="#ffe2b0" intensity={0.5} distance={2.6} decay={2} />
        </group>
      </group>
    </group>
  );
});
