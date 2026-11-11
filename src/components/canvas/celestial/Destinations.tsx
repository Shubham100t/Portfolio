"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DestinationId } from "@/types/universe";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { Nebula } from "./Nebula";
import { Wormhole } from "./Wormhole";
import { Pulsar } from "./Pulsar";
import { SupernovaRemnant } from "./Supernova";

type Item = { id: DestinationId; label: string; position: [number, number, number]; color: string; kind: "pulsar" | "nebula" | "supernova" | "station" | "gateway" };
const destinations: Item[] = [
  { id: "skills", label: "SKILLS // PULSAR", position: [-28, 8, -22], color: "#a78bfa", kind: "pulsar" },
  { id: "projects", label: "PROJECTS // NEBULA", position: [30, 4, -30], color: "#38bdf8", kind: "nebula" },
  { id: "achievements", label: "ACHIEVEMENTS // SUPERNOVA REMNANT", position: [-34, -7, 18], color: "#fb923c", kind: "supernova" },
  { id: "contact", label: "CONTACT // ORBITAL STATION", position: [25, -8, 24], color: "#e2e8f0", kind: "station" },
  { id: "resume", label: "RESUME // WORMHOLE", position: [4, 14, -42], color: "#fbbf24", kind: "gateway" },
];

export const DESTINATION_POSITIONS: Record<DestinationId, [number, number, number]> = {
  about: [0, 0, 0], skills: [-28, 8, -22], projects: [30, 4, -30], achievements: [-34, -7, 18], contact: [25, -8, 24], resume: [4, 14, -42],
};

// Solar arrays: individual photovoltaic cells with silver bus bars, per-cell
// tone variation and a slow diagonal reflection so the wings read as
// structured hardware instead of flat dark boxes.
const solarVertexShader = /* glsl */ `
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

const solarFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 cells = vUv * vec2(9.0, 13.0);
    vec2 f = fract(cells);
    vec2 id = floor(cells);

    // 0 on the bus bars, 1 inside the cell.
    float inside = smoothstep(0.0, 0.05, min(f.x, 1.0 - f.x)) * smoothstep(0.0, 0.05, min(f.y, 1.0 - f.y));

    float vary = hash(id);
    vec3 cell = mix(vec3(0.012, 0.045, 0.10), vec3(0.035, 0.16, 0.34), vary);
    vec3 bus = vec3(0.30, 0.52, 0.76);
    vec3 col = mix(bus, cell, inside);

    // Each cell catches the sun slightly differently.
    float sheen = pow(max(0.0, dot(normalize(vNormalView), normalize(vViewDir + vec3(0.0, 0.6, 0.0)))), 3.0);
    col += vec3(0.3, 0.6, 1.0) * sheen * (0.05 + 0.12 * vary) * inside;

    // Slow diagonal reflection washing over the whole array.
    float band = smoothstep(0.7, 1.0, sin((vUv.x * 2.2 + vUv.y) * 5.0 - uTime * 0.6));
    col += vec3(0.45, 0.72, 1.0) * band * 0.06;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const stationMats = {
  frame: new THREE.MeshStandardMaterial({ color: "#8ba0b8", metalness: 0.92, roughness: 0.28 }),
  hull: new THREE.MeshStandardMaterial({ color: "#dbe4f0", metalness: 0.62, roughness: 0.34 }),
  hullDark: new THREE.MeshStandardMaterial({ color: "#9aabbd", metalness: 0.82, roughness: 0.3, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: "#e0a43a", metalness: 0.9, roughness: 0.25, emissive: "#5a3208", emissiveIntensity: 0.3 }),
  window: new THREE.MeshBasicMaterial({ color: "#8be9ff" }),
  radiator: new THREE.MeshStandardMaterial({ color: "#eef2f7", metalness: 0.3, roughness: 0.55, side: THREE.DoubleSide }),
  dark: new THREE.MeshStandardMaterial({ color: "#232f3d", metalness: 0.55, roughness: 0.45 }),
  beaconRed: new THREE.MeshBasicMaterial({ color: "#ff5a5a", toneMapped: false }),
  beaconWhite: new THREE.MeshBasicMaterial({ color: "#eaf6ff", toneMapped: false }),
};

function SolarPanel({ z, uniforms }: { z: number; uniforms: { uTime: { value: number } } }) {
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.42, 1.92]} />
        <shaderMaterial uniforms={uniforms} vertexShader={solarVertexShader} fragmentShader={solarFragmentShader} side={THREE.DoubleSide} />
      </mesh>
      {/* Frame rails */}
      {[-0.72, 0.72].map((dx) => (
        <mesh key={`x${dx}`} position={[dx, 0.02, 0]} material={stationMats.frame}>
          <boxGeometry args={[0.045, 0.035, 1.98]} />
        </mesh>
      ))}
      {[-0.97, 0.97].map((dz) => (
        <mesh key={`z${dz}`} position={[0, 0.02, dz]} material={stationMats.frame}>
          <boxGeometry args={[1.5, 0.035, 0.045]} />
        </mesh>
      ))}
      <mesh position={[0, 0.025, 0]} material={stationMats.gold}>
        <boxGeometry args={[0.03, 0.02, 1.98]} />
      </mesh>
    </group>
  );
}

function SolarWing({ side, uniforms }: { side: 1 | -1; uniforms: { uTime: { value: number } } }) {
  return (
    <group position={[side * 4.9, 0, 0]}>
      <mesh position={[-side * 0.55, 0, 0]} material={stationMats.gold}>
        <boxGeometry args={[1.0, 0.09, 0.16]} />
      </mesh>
      <mesh position={[-side * 0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={stationMats.frame}>
        <cylinderGeometry args={[0.09, 0.09, 0.24, 14]} />
      </mesh>
      <SolarPanel z={-1.0} uniforms={uniforms} />
      <SolarPanel z={1.0} uniforms={uniforms} />
      <mesh position={[0, 0.06, side * 2.06]} material={stationMats.beaconRed}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
    </group>
  );
}

function Station() {
  const root = useRef<THREE.Group>(null!);
  const arrays = useRef<THREE.Group>(null!);
  const dish = useRef<THREE.Group>(null!);
  const solarUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Lattice truss: one instanced mesh of zig-zag diagonals on both faces.
  const truss = useMemo(() => {
    const SPAN = 11;
    const SEG = 14;
    const HALF_H = 0.22;
    const HALF_D = 0.42;
    const geometry = new THREE.CylinderGeometry(0.016, 0.016, 1, 6);
    const mesh = new THREE.InstancedMesh(geometry, stationMats.frame, SEG * 2);
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const scale = new THREE.Vector3();
    let i = 0;
    for (const z of [-HALF_D, HALF_D]) {
      for (let k = 0; k < SEG; k++) {
        const x0 = -SPAN / 2 + (k / SEG) * SPAN;
        const x1 = -SPAN / 2 + ((k + 1) / SEG) * SPAN;
        const y0 = k % 2 === 0 ? -HALF_H : HALF_H;
        const y1 = -y0;
        dir.set(x1 - x0, y1 - y0, 0);
        const length = dir.length();
        quat.setFromUnitVectors(up, dir.normalize());
        offset.set((x0 + x1) / 2, (y0 + y1) / 2, z);
        scale.set(1, length, 1);
        matrix.compose(offset, quat, scale);
        mesh.setMatrixAt(i++, matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    solarUniforms.uTime.value = t;
    if (root.current) {
      root.current.rotation.y = -0.55 + Math.sin(t * 0.09) * 0.14;
      root.current.position.y = Math.sin(t * 0.22) * 0.18;
    }
    if (arrays.current) arrays.current.rotation.x = Math.sin(t * 0.06) * 0.2;
    if (dish.current) dish.current.rotation.y = Math.sin(t * 0.07) * 0.6;

    // Out-of-phase strobes: red hazards and the white dish beacon.
    const red = Math.pow(0.5 + 0.5 * Math.sin(t * 1.9), 8);
    stationMats.beaconRed.color.setRGB(0.12 + red, 0.04 + red * 0.18, 0.04 + red * 0.18);
    const white = Math.pow(0.5 + 0.5 * Math.sin(t * 1.9 + Math.PI), 8);
    stationMats.beaconWhite.color.setRGB(0.18 + white * 0.85, 0.28 + white * 0.8, 0.4 + white * 0.7);
  });

  return (
    <group ref={root} rotation={[0.05, -0.55, 0.12]}>
      {/* Core spine + lattice truss */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={stationMats.frame}>
        <cylinderGeometry args={[0.09, 0.09, 11.2, 12]} />
      </mesh>
      <primitive object={truss} />
      {[-0.42, 0.42].map((z) =>
        [-0.22, 0.22].map((y) => (
          <mesh key={`${z}${y}`} position={[0, y, z]} material={stationMats.frame}>
            <boxGeometry args={[11.4, 0.045, 0.045]} />
          </mesh>
        ))
      )}

      {/* Pressurised modules with window bands */}
      {[-2.35, -1.15, 0, 1.15, 2.35].map((x, i) => {
        const radius = 0.6 + (i % 2) * 0.14;
        return (
          <group key={x} position={[x, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={i === 2 ? stationMats.hull : stationMats.hullDark}>
              <cylinderGeometry args={[radius, radius, 1.0, 28]} />
            </mesh>
            {[-0.48, 0.48].map((dx) => (
              <mesh key={dx} position={[dx, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={stationMats.frame}>
                <torusGeometry args={[radius + 0.005, 0.02, 8, 32]} />
              </mesh>
            ))}
            <mesh rotation={[0, Math.PI / 2, 0]} material={stationMats.window}>
              <torusGeometry args={[radius + 0.012, 0.014, 8, 40]} />
            </mesh>
          </group>
        );
      })}

      {/* Cupola on the centre module */}
      <group position={[0, 0.6, 0]}>
        <mesh material={stationMats.hullDark}>
          <sphereGeometry args={[0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={stationMats.window}>
          <torusGeometry args={[0.26, 0.012, 8, 32]} />
        </mesh>
      </group>

      {/* Antenna mast + tracking dish */}
      <mesh position={[0, 0.94, 0]} material={stationMats.frame}>
        <cylinderGeometry args={[0.035, 0.05, 0.55, 12]} />
      </mesh>
      <group ref={dish} position={[0, 1.2, 0]}>
        <mesh material={stationMats.dark}>
          <cylinderGeometry args={[0.06, 0.09, 0.16, 14]} />
        </mesh>
        <group position={[0, 0.1, 0]} rotation={[-0.42, 0, 0]}>
          <mesh material={stationMats.hullDark}>
            <sphereGeometry args={[0.52, 32, 18, 0, Math.PI * 2, 0, 0.9]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={stationMats.frame}>
            <cylinderGeometry args={[0.014, 0.014, 0.42, 8]} />
          </mesh>
          <mesh position={[0, 0.6, 0]} material={stationMats.beaconWhite}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>
        </group>
      </group>

      {/* Radiator panel under the truss */}
      <group position={[0, -0.62, 0]}>
        <mesh material={stationMats.radiator}>
          <boxGeometry args={[1.9, 0.035, 1.15]} />
        </mesh>
        <mesh position={[0, -0.02, 0]} material={stationMats.frame}>
          <boxGeometry args={[1.96, 0.02, 0.05]} />
        </mesh>
        {[-0.55, 0.55].map((dx) => (
          <mesh key={dx} position={[dx, 0.18, 0]} material={stationMats.frame}>
            <cylinderGeometry args={[0.025, 0.025, 0.38, 8]} />
          </mesh>
        ))}
      </group>

      {/* Sun-tracking solar arrays */}
      <group ref={arrays}>
        <SolarWing side={-1} uniforms={solarUniforms} />
        <SolarWing side={1} uniforms={solarUniforms} />
      </group>

      {/* Truss tip beacons */}
      {[-5.45, 5.45].map((x) => (
        <mesh key={x} position={[x, 0.26, 0]} material={stationMats.beaconRed}>
          <sphereGeometry args={[0.055, 12, 12]} />
        </mesh>
      ))}

      <pointLight color="#bfdbfe" intensity={2.6} distance={11} />
      <pointLight position={[0, -0.9, 0]} color="#fbbf24" intensity={0.7} distance={6} decay={2} />
    </group>
  );
}

function Landmark({ item }: { item: Item }) {
  const setDestination = useUniverseStore((s) => s.setActiveDestination);
  const visual = item.kind === "pulsar" ? <Pulsar /> : item.kind === "nebula" ? <Nebula /> : item.kind === "supernova" ? <SupernovaRemnant /> : item.kind === "station" ? <Station /> : <Wormhole />;
  return <group position={item.position} onClick={(event) => { event.stopPropagation(); setDestination(item.id); }}>
    {visual}<Billboard position={[0, 5.4, 0]}><Text fontSize={.56} color={item.color} anchorX="center" outlineWidth={.014} outlineColor="#020617">{item.label}</Text></Billboard>
  </group>;
}

export function Destinations() { return <>{destinations.map((item) => <Landmark key={item.id} item={item} />)}</>; }
