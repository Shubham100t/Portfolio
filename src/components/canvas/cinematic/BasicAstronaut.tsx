"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function BasicAstronaut() {
  const groupRef = useRef<THREE.Group>(null!);

  // White EVA spacesuit fabric material
  const suitMaterial = new THREE.MeshStandardMaterial({
    color: "#f1f5f9",
    roughness: 0.65,
    metalness: 0.1,
  });

  // Dark joint fabric material
  const jointMaterial = new THREE.MeshStandardMaterial({
    color: "#334155",
    roughness: 0.8,
    metalness: 0.2,
  });

  // Gold reflective astronaut visor (reflects stars and lights)
  const visorMaterial = new THREE.MeshStandardMaterial({
    color: "#eab308",
    roughness: 0.12,
    metalness: 0.96,
    emissive: "#ca8a04",
    emissiveIntensity: 0.15,
  });

  // PLSS life support backpack material
  const packMaterial = new THREE.MeshStandardMaterial({
    color: "#e2e8f0",
    roughness: 0.4,
    metalness: 0.3,
  });

  // Zero-G procedural breathing and rotational inertia
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle spatial float
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.08;
      groupRef.current.position.x = Math.cos(t * 0.5) * 0.05;

      // Authentic zero-gravity micro-tumble
      groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.06;
      groupRef.current.rotation.y = Math.cos(t * 0.28) * 0.12;
      groupRef.current.rotation.z = Math.sin(t * 0.22) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* --- HEAD & HELMET --- */}
      <group position={[0, 1.45, 0]}>
        {/* Helmet outer shell */}
        <mesh material={suitMaterial}>
          <sphereGeometry args={[0.38, 32, 32]} />
        </mesh>
        {/* Golden curved reflective visor */}
        <mesh position={[0, 0.02, 0.22]} rotation={[0.1, 0, 0]} material={visorMaterial}>
          <sphereGeometry args={[0.3, 32, 16, 0, Math.PI, 0, Math.PI * 0.6]} />
        </mesh>
        {/* Helmet ring collar */}
        <mesh position={[0, -0.32, 0]} material={jointMaterial}>
          <cylinderGeometry args={[0.32, 0.34, 0.1, 32]} />
        </mesh>
        {/* Helmet mounted EVA lights */}
        <mesh position={[0.38, 0.05, 0.1]} material={packMaterial}>
          <boxGeometry args={[0.08, 0.08, 0.12]} />
        </mesh>
        <mesh position={[-0.38, 0.05, 0.1]} material={packMaterial}>
          <boxGeometry args={[0.08, 0.08, 0.12]} />
        </mesh>
      </group>

      {/* --- TORSO & CHEST PACK --- */}
      <group position={[0, 0.75, 0]}>
        {/* Main upper body torso */}
        <mesh material={suitMaterial}>
          <cylinderGeometry args={[0.42, 0.36, 0.95, 24]} />
        </mesh>
        {/* Chest remote control module (DCM) */}
        <mesh position={[0, 0.12, 0.38]} material={packMaterial}>
          <boxGeometry args={[0.42, 0.35, 0.15]} />
        </mesh>
        {/* Chest telemetry indicator lights */}
        <mesh position={[-0.12, 0.2, 0.46]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-0.05, 0.2, 0.46]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0.08, 0.2, 0.46]}>
          <boxGeometry args={[0.08, 0.04, 0.02]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* --- PLSS BACKPACK (Primary Life Support System) --- */}
      <group position={[0, 0.75, -0.42]}>
        <mesh material={packMaterial}>
          <boxGeometry args={[0.72, 0.98, 0.36]} />
        </mesh>
        {/* Thruster / RCS nozzles */}
        <mesh position={[0.28, 0.45, -0.1]} material={jointMaterial}>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        </mesh>
        <mesh position={[-0.28, 0.45, -0.1]} material={jointMaterial}>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        </mesh>
        {/* Status beacon on backpack */}
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* --- LEFT ARM (Relaxed zero-G pose) --- */}
      <group position={[-0.55, 1.05, 0]}>
        <mesh rotation={[0.2, 0, 0.3]} material={suitMaterial}>
          <cylinderGeometry args={[0.14, 0.13, 0.55, 16]} />
        </mesh>
        {/* Elbow */}
        <group position={[-0.15, -0.45, 0.08]}>
          <mesh material={jointMaterial}>
            <sphereGeometry args={[0.13, 16, 16]} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.05, -0.28, 0.1]} rotation={[0.4, 0, -0.15]} material={suitMaterial}>
            <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
          </mesh>
          {/* Glove */}
          <mesh position={[-0.08, -0.58, 0.22]} material={jointMaterial}>
            <boxGeometry args={[0.14, 0.16, 0.1]} />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT ARM (Relaxed zero-G pose) --- */}
      <group position={[0.55, 1.05, 0]}>
        <mesh rotation={[0.1, 0, -0.35]} material={suitMaterial}>
          <cylinderGeometry args={[0.14, 0.13, 0.55, 16]} />
        </mesh>
        {/* Elbow */}
        <group position={[0.18, -0.45, 0.05]}>
          <mesh material={jointMaterial}>
            <sphereGeometry args={[0.13, 16, 16]} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.05, -0.28, 0.08]} rotation={[0.3, 0, 0.1]} material={suitMaterial}>
            <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
          </mesh>
          {/* Glove */}
          <mesh position={[0.08, -0.58, 0.18]} material={jointMaterial}>
            <boxGeometry args={[0.14, 0.16, 0.1]} />
          </mesh>
        </group>
      </group>

      {/* --- HIPS & WAIST --- */}
      <group position={[0, 0.18, 0]}>
        <mesh material={jointMaterial}>
          <cylinderGeometry args={[0.36, 0.35, 0.25, 24]} />
        </mesh>
      </group>

      {/* --- LEFT LEG --- */}
      <group position={[-0.22, 0.05, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.35, 0.05]} rotation={[-0.15, 0, 0.1]} material={suitMaterial}>
          <cylinderGeometry args={[0.16, 0.14, 0.65, 16]} />
        </mesh>
        {/* Knee joint */}
        <group position={[0.04, -0.72, 0.15]}>
          <mesh material={jointMaterial}>
            <sphereGeometry args={[0.14, 16, 16]} />
          </mesh>
          {/* Shin */}
          <mesh position={[0, -0.32, -0.05]} rotation={[0.2, 0, 0]} material={suitMaterial}>
            <cylinderGeometry args={[0.14, 0.13, 0.6, 16]} />
          </mesh>
          {/* EVA Boot */}
          <mesh position={[0, -0.65, 0.08]} material={jointMaterial}>
            <boxGeometry args={[0.18, 0.18, 0.38]} />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT LEG --- */}
      <group position={[0.22, 0.05, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.35, -0.02]} rotation={[0.1, 0, -0.08]} material={suitMaterial}>
          <cylinderGeometry args={[0.16, 0.14, 0.65, 16]} />
        </mesh>
        {/* Knee joint */}
        <group position={[-0.03, -0.72, 0.05]}>
          <mesh material={jointMaterial}>
            <sphereGeometry args={[0.14, 16, 16]} />
          </mesh>
          {/* Shin */}
          <mesh position={[0, -0.32, 0.02]} rotation={[-0.1, 0, 0]} material={suitMaterial}>
            <cylinderGeometry args={[0.14, 0.13, 0.6, 16]} />
          </mesh>
          {/* EVA Boot */}
          <mesh position={[0, -0.65, 0.15]} material={jointMaterial}>
            <boxGeometry args={[0.18, 0.18, 0.38]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
