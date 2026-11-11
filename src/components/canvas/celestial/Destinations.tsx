"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DestinationId } from "@/types/universe";
import { useUniverseStore } from "@/stores/useUniverseStore";

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

function Pulsar() {
  const root = useRef<THREE.Group>(null!); const core = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => { const t = clock.getElapsedTime(); if (root.current) root.current.rotation.y = .3 + t * 0.55; if (core.current) core.current.emissiveIntensity = 3.5 + Math.sin(t * 8.7) * 1.8; });
  return <group ref={root} rotation={[0.38, 0.3, -0.2]}>
    <pointLight color="#b9a6ff" intensity={9} distance={16} />
    <mesh><sphereGeometry args={[1.02, 48, 48]} /><meshStandardMaterial ref={core} color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={4} roughness={0.28} metalness={0.15} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.72, 0.08, 12, 96]} /><meshBasicMaterial color="#67e8f9" transparent opacity={0.82} /></mesh>
    {[-1, 1].map((sign) => <group key={sign} position={[0, sign * 3.8, 0]}>
      <mesh><coneGeometry args={[sign > 0 ? 0.12 : 0.76, 5.8, 28, 1, true]} /><meshBasicMaterial color="#7dd3fc" transparent opacity={0.32} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
      <pointLight color="#7dd3fc" intensity={2.5} distance={7} />
    </group>)}
  </group>;
}

function useGlowMap() {
  return useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)"); gradient.addColorStop(.22, "rgba(255,245,220,.92)"); gradient.addColorStop(.62, "rgba(255,142,46,.22)"); gradient.addColorStop(1, "rgba(255,96,16,0)");
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
}

function Nebula() {
  const root = useRef<THREE.Points>(null!); const glowMap = useGlowMap();
  const { positions, colors } = useMemo(() => {
    const curves = [
      new THREE.CatmullRomCurve3([new THREE.Vector3(-2.7, -3.4, .1), new THREE.Vector3(-2.2, -1.3, -.35), new THREE.Vector3(-2.65, .9, .12), new THREE.Vector3(-1.65, 3.65, .1)]),
      new THREE.CatmullRomCurve3([new THREE.Vector3(-.18, -3.6, -.3), new THREE.Vector3(.32, -1.55, .4), new THREE.Vector3(-.1, .28, -.16), new THREE.Vector3(.78, 2.7, .3)]),
      new THREE.CatmullRomCurve3([new THREE.Vector3(2.25, -3.25, .1), new THREE.Vector3(1.88, -1.45, -.25), new THREE.Vector3(2.55, .12, .22), new THREE.Vector3(2.18, 1.85, -.14)]),
    ];
    const count = 5600; const p = new Float32Array(count * 3); const c = new Float32Array(count * 3); const orange = new THREE.Color("#f97316"); const violet = new THREE.Color("#7c3aed"); const soot = new THREE.Color("#160b08"); const color = new THREE.Color();
    for (let i = 0; i < count; i++) { const curve = curves[Math.floor(Math.random() * curves.length)]; const t = Math.random(); const point = curve.getPoint(t); const width = (.2 + .6 * (1 - t)) * Math.pow(Math.random(), .42); const angle = Math.random() * Math.PI * 2; point.x += Math.cos(angle) * width; point.y += (Math.random() - .5) * width * .7; point.z += Math.sin(angle) * width * .7; p.set(point.toArray(), i * 3); const ember = Math.pow(Math.random(), 3.2); color.copy(soot).lerp(i % 5 === 0 ? violet : orange, ember); c.set([color.r, color.g, color.b], i * 3); }
    return { positions: p, colors: c };
  }, []);
  useFrame(({ clock }) => { if (root.current) { const t = clock.getElapsedTime(); root.current.rotation.y = t * .018; root.current.rotation.z = Math.sin(t * .11) * .028; } });
  return <points ref={root} rotation={[.05, -.35, -.06]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry><pointsMaterial map={glowMap} vertexColors size={.145} sizeAttenuation transparent opacity={.82} alphaTest={.02} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

function SupernovaRemnant() {
  const root = useRef<THREE.Points>(null!); const glowMap = useGlowMap();
  const { positions, colors } = useMemo(() => { const count = 7600; const p = new Float32Array(count * 3); const c = new Float32Array(count * 3); const cyan = new THREE.Color("#38bdf8"); const orange = new THREE.Color("#fb923c"); const red = new THREE.Color("#fb7185"); const color = new THREE.Color(); for (let i = 0; i < count; i++) { const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); const filament = .72 + .38 * Math.pow(Math.sin(theta * 6 + phi * 5), 2); const radius = (2.5 + Math.random() * 2.3) * filament; p[i * 3] = radius * Math.sin(phi) * Math.cos(theta); p[i * 3 + 1] = radius * Math.cos(phi) * .74; p[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta); color.copy(Math.random() < .54 ? cyan : Math.random() < .7 ? orange : red).multiplyScalar(.45 + Math.random() * .75); c.set([color.r, color.g, color.b], i * 3); } return { positions: p, colors: c }; }, []);
  useFrame(({ clock }) => { if (root.current) { const t = clock.getElapsedTime(); root.current.rotation.y = t * .022; root.current.rotation.z = -.42 + Math.sin(t * .23) * .025; root.current.scale.setScalar(1 + Math.sin(t * .38) * .018); } });
  return <><points ref={root} rotation={[.16, -.4, -.45]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry><pointsMaterial map={glowMap} vertexColors size={.105} sizeAttenuation transparent opacity={.84} alphaTest={.015} depthWrite={false} blending={THREE.AdditiveBlending} /></points><pointLight color="#fb923c" intensity={2.5} distance={13} /></>;
}

function SolarWing({ x }: { x: number }) { return <group position={[x, 0, 0]}><mesh><boxGeometry args={[1.25, .08, 4.4]} /><meshStandardMaterial color="#082f49" metalness={.8} roughness={.25} emissive="#0c4a6e" emissiveIntensity={.55} /></mesh>{[-1.65, -.55, .55, 1.65].map((offset) => <mesh key={offset} position={[0, .05, offset]}><boxGeometry args={[1.32, .025, .025]} /><meshBasicMaterial color="#7dd3fc" /></mesh>)}</group>; }

function Station() {
  const root = useRef<THREE.Group>(null!); const arrays = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { const t = clock.getElapsedTime(); if (root.current) { root.current.rotation.y = -.55 + Math.sin(t * .09) * .14; root.current.position.y = Math.sin(t * .22) * .18; } if (arrays.current) arrays.current.rotation.y = t * .045; });
  return <group ref={root} rotation={[.05, -.55, .12]}>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.12, .12, 11.5, 12]} /><meshStandardMaterial color="#94a3b8" metalness={.92} roughness={.23} /></mesh>
    {[-2.3, -1.1, 0, 1.15, 2.4].map((x, i) => <group key={x} position={[x, 0, 0]}><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.62 + (i % 2) * .12, .62, 1.65, 24]} /><meshStandardMaterial color="#dbeafe" metalness={.72} roughness={.32} /></mesh>{i === 2 && <mesh position={[0, .76, 0]}><sphereGeometry args={[.42, 24, 24]} /><meshStandardMaterial color="#cbd5e1" metalness={.8} roughness={.25} /></mesh>}</group>)}
    <group ref={arrays}><SolarWing x={-4.2} /><SolarWing x={4.2} /><mesh position={[0, 1.4, 0]}><boxGeometry args={[4.2, .08, .72]} /><meshStandardMaterial color="#94a3b8" metalness={.8} roughness={.3} /></mesh></group>
    <pointLight color="#bfdbfe" intensity={2.4} distance={10} />
  </group>;
}

function Wormhole() {
  const disc = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock, camera }) => { uniforms.uTime.value = clock.getElapsedTime(); if (disc.current) disc.current.quaternion.copy(camera.quaternion); });
  const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const fragmentShader = `
    uniform float uTime; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
    void main() { vec2 p=vUv*2.0-1.0; float r=length(p); float a=atan(p.y,p.x); float warp=a + 1.8/(r+.12) - uTime*.24; float stream=.5+.5*sin(warp*8.0 + log(r+.04)*18.0); float turbulence=noise(vec2(a*3.0, r*18.0-uTime*.35)); float edge=smoothstep(.98,.13,r); float core=smoothstep(.19,.31,r); float filament=smoothstep(.57,.9,stream)*(.58+.42*turbulence)*edge*core; vec3 gold=vec3(1.0,.42,.035); vec3 blue=vec3(.08,.72,1.0); vec3 color=mix(gold,blue,.3+.3*sin(warp*2.0))*filament; color += vec3(1.0,.78,.35)*pow(filament,3.0); float alpha=filament*smoothstep(1.02,.7,r); if(r<.19) { color=vec3(0.002,0.004,0.009); alpha=1.0; } gl_FragColor=vec4(color,alpha); }`;
  return <group><pointLight color="#fbbf24" intensity={4.3} distance={16} /><mesh ref={disc} renderOrder={3}><circleGeometry args={[4.5, 160]} /><shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.NormalBlending} /></mesh></group>;
}

function Landmark({ item }: { item: Item }) {
  const setDestination = useUniverseStore((s) => s.setActiveDestination);
  const visual = item.kind === "pulsar" ? <Pulsar /> : item.kind === "nebula" ? <Nebula /> : item.kind === "supernova" ? <SupernovaRemnant /> : item.kind === "station" ? <Station /> : <Wormhole />;
  return <group position={item.position} onClick={(event) => { event.stopPropagation(); setDestination(item.id); }}>
    {visual}<Billboard position={[0, 5.4, 0]}><Text fontSize={.56} color={item.color} anchorX="center" outlineWidth={.014} outlineColor="#020617">{item.label}</Text></Billboard>
  </group>;
}

export function Destinations() { return <>{destinations.map((item) => <Landmark key={item.id} item={item} />)}</>; }
