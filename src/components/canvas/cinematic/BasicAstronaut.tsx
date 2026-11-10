"use client";

import React, { useRef, useMemo, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * BasicAstronaut
 * Wrapped with forwardRef so CinematicDirector can GSAP-animate the outer group
 * (world position / rotation) while the inner zero-G float animation runs additively.
 */
export const BasicAstronaut = forwardRef<THREE.Group>(function BasicAstronaut(_props, ref) {
  const innerRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const astronautWorldPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraToAstronaut = useMemo(() => new THREE.Vector3(), []);
  const closestApproach = useMemo(() => new THREE.Vector3(), []);

  // Memoized PBR materials
  const { suitMat, jointMat, visorMat, packMat, ledCyan, ledGreen, ledAmber } = useMemo(() => {
    return {
      suitMat: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.6,
        metalness: 0.15,
      }),
      jointMat: new THREE.MeshStandardMaterial({
        color: "#1e293b",
        roughness: 0.8,
        metalness: 0.3,
      }),
      visorMat: new THREE.MeshStandardMaterial({
        color: "#f59e0b",
        roughness: 0.08,
        metalness: 0.98,
        emissive: "#b45309",
        emissiveIntensity: 0.25,
        side: THREE.DoubleSide,
      }),
      packMat: new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.35,
        metalness: 0.4,
      }),
      ledCyan: new THREE.MeshBasicMaterial({ color: "#38bdf8" }),
      ledGreen: new THREE.MeshBasicMaterial({ color: "#4ade80" }),
      ledAmber: new THREE.MeshBasicMaterial({ color: "#fbbf24" }),
    };
  }, []);

  // Zero-gravity harmonic floating — additive on top of GSAP-driven outer group
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerRef.current) {
      innerRef.current.position.y = Math.sin(t * 0.8) * 0.07;
      innerRef.current.position.x = Math.cos(t * 0.6) * 0.04;
      innerRef.current.rotation.x = Math.sin(t * 0.4) * 0.05;
      innerRef.current.rotation.y = Math.cos(t * 0.3) * 0.08;
      innerRef.current.rotation.z = Math.sin(t * 0.25) * 0.04;

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
      // The near-horizon segment also applies a mild tidal stretch so the
      // descent is visibly affected even before an exact camera alignment.
      const tidalStrength = (1.0 - THREE.MathUtils.smoothstep(3.2, 6.2, astronautWorldPosition.length())) * 0.65;
      const distortion = Math.max(lensStrength, tidalStrength);
      innerRef.current.scale.set(1.0 - distortion * 0.34, 1.0 + distortion * 0.9, 1.0 - distortion * 0.25);
    }
  });

  return (
    // Outer group: controlled by CinematicDirector via forwardRef
    <group ref={ref}>
      {/* Inner group: zero-G float animation */}
      <group ref={innerRef}>
        {/* --- HEAD & HELMET --- */}
        <group position={[0, 1.45, 0]}>
          <mesh material={suitMat}>
            <sphereGeometry args={[0.38, 32, 32]} />
          </mesh>
          <mesh position={[0, 0.03, 0.2]} rotation={[0.1, 0, 0]} material={visorMat}>
            <sphereGeometry args={[0.3, 32, 24, 0, Math.PI, 0, Math.PI * 0.65]} />
          </mesh>
          <mesh position={[0, -0.32, 0]} material={jointMat}>
            <cylinderGeometry args={[0.32, 0.34, 0.1, 32]} />
          </mesh>
          <mesh position={[0.36, 0.08, 0.1]} material={packMat}>
            <boxGeometry args={[0.08, 0.08, 0.12]} />
          </mesh>
          <mesh position={[-0.36, 0.08, 0.1]} material={packMat}>
            <boxGeometry args={[0.08, 0.08, 0.12]} />
          </mesh>
        </group>

        {/* --- TORSO & CHEST PACK --- */}
        <group position={[0, 0.75, 0]}>
          <mesh material={suitMat}>
            <cylinderGeometry args={[0.42, 0.36, 0.95, 24]} />
          </mesh>
          <mesh position={[0, 0.12, 0.36]} material={packMat}>
            <boxGeometry args={[0.42, 0.35, 0.15]} />
          </mesh>
          <mesh position={[-0.12, 0.2, 0.44]} material={ledCyan}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
          </mesh>
          <mesh position={[-0.04, 0.2, 0.44]} material={ledGreen}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
          </mesh>
          <mesh position={[0.08, 0.2, 0.44]} material={ledAmber}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
          </mesh>
        </group>

        {/* --- PLSS BACKPACK (Life Support) --- */}
        <group position={[0, 0.75, -0.42]}>
          <mesh material={packMat}>
            <boxGeometry args={[0.72, 0.98, 0.36]} />
          </mesh>
          <mesh position={[0.26, 0.46, -0.1]} material={jointMat}>
            <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
          </mesh>
          <mesh position={[-0.26, 0.46, -0.1]} material={jointMat}>
            <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
          </mesh>
          <mesh position={[0, 0.52, 0]} material={ledCyan}>
            <sphereGeometry args={[0.05, 16, 16]} />
          </mesh>
        </group>

        {/* --- LEFT ARM --- */}
        <group position={[-0.55, 1.05, 0]}>
          <mesh rotation={[0.2, 0, 0.3]} material={suitMat}>
            <cylinderGeometry args={[0.14, 0.13, 0.55, 16]} />
          </mesh>
          <group position={[-0.15, -0.45, 0.08]}>
            <mesh material={jointMat}>
              <sphereGeometry args={[0.13, 16, 16]} />
            </mesh>
            <mesh position={[-0.05, -0.28, 0.1]} rotation={[0.4, 0, -0.15]} material={suitMat}>
              <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
            </mesh>
            <mesh position={[-0.08, -0.58, 0.22]} material={jointMat}>
              <boxGeometry args={[0.14, 0.16, 0.1]} />
            </mesh>
          </group>
        </group>

        {/* --- RIGHT ARM --- */}
        <group position={[0.55, 1.05, 0]}>
          <mesh rotation={[0.1, 0, -0.35]} material={suitMat}>
            <cylinderGeometry args={[0.14, 0.13, 0.55, 16]} />
          </mesh>
          <group position={[0.18, -0.45, 0.05]}>
            <mesh material={jointMat}>
              <sphereGeometry args={[0.13, 16, 16]} />
            </mesh>
            <mesh position={[0.05, -0.28, 0.08]} rotation={[0.3, 0, 0.1]} material={suitMat}>
              <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
            </mesh>
            <mesh position={[0.08, -0.58, 0.18]} material={jointMat}>
              <boxGeometry args={[0.14, 0.16, 0.1]} />
            </mesh>
          </group>
        </group>

        {/* --- HIPS & WAIST --- */}
        <group position={[0, 0.18, 0]}>
          <mesh material={jointMat}>
            <cylinderGeometry args={[0.36, 0.35, 0.25, 24]} />
          </mesh>
        </group>

        {/* --- LEFT LEG --- */}
        <group position={[-0.22, 0.05, 0]}>
          <mesh position={[0, -0.35, 0.05]} rotation={[-0.15, 0, 0.1]} material={suitMat}>
            <cylinderGeometry args={[0.16, 0.14, 0.65, 16]} />
          </mesh>
          <group position={[0.04, -0.72, 0.15]}>
            <mesh material={jointMat}>
              <sphereGeometry args={[0.14, 16, 16]} />
            </mesh>
            <mesh position={[0, -0.32, -0.05]} rotation={[0.2, 0, 0]} material={suitMat}>
              <cylinderGeometry args={[0.14, 0.13, 0.6, 16]} />
            </mesh>
            <mesh position={[0, -0.65, 0.08]} material={jointMat}>
              <boxGeometry args={[0.18, 0.18, 0.38]} />
            </mesh>
          </group>
        </group>

        {/* --- RIGHT LEG --- */}
        <group position={[0.22, 0.05, 0]}>
          <mesh position={[0, -0.35, -0.02]} rotation={[0.1, 0, -0.08]} material={suitMat}>
            <cylinderGeometry args={[0.16, 0.14, 0.65, 16]} />
          </mesh>
          <group position={[-0.03, -0.72, 0.05]}>
            <mesh material={jointMat}>
              <sphereGeometry args={[0.14, 16, 16]} />
            </mesh>
            <mesh position={[0, -0.32, 0.02]} rotation={[-0.1, 0, 0]} material={suitMat}>
              <cylinderGeometry args={[0.14, 0.13, 0.6, 16]} />
            </mesh>
            <mesh position={[0, -0.65, 0.15]} material={jointMat}>
              <boxGeometry args={[0.18, 0.18, 0.38]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});
