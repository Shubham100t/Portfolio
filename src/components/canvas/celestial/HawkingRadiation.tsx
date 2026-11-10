"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface HawkingRadiationProps {
  eventHorizonRadius: number;
  /** Sparse by design: this is a labelled visual metaphor, not a bright glow. */
  count?: number;
}

const vertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uEventHorizonRadius;
  varying float vFlicker;

  void main() {
    float journey = fract(aPhase + uTime * (0.022 + aSize * 0.003));
    vec3 direction = normalize(position);
    vec3 drift = vec3(
      sin(uTime * 0.7 + aPhase * 31.0),
      cos(uTime * 0.9 + aPhase * 17.0),
      sin(uTime * 0.55 + aPhase * 23.0)
    ) * 0.01;
    // Stay outside the Schwarzschild radius: these cues sit just above the
    // horizon instead of appearing inside the black shadow.
    vec3 emittedPosition = direction * uEventHorizonRadius * mix(1.23, 1.62, journey) + drift;
    vec4 mvPosition = modelViewMatrix * vec4(emittedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (1.0 - journey) * (44.0 / -mvPosition.z);
    vFlicker = (1.0 - journey) * (0.4 + 0.6 * sin(uTime * 3.0 + aPhase * 80.0));
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying float vFlicker;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float softPoint = 1.0 - smoothstep(0.05, 0.5, distanceToCenter);
    vec3 quantumViolet = vec3(0.34, 0.16, 1.0);
    gl_FragColor = vec4(quantumViolet, softPoint * vFlicker * 0.15);
  }
`;

/**
 * An intentionally faint visualization of quantum vacuum fluctuations.
 * A stellar-mass or supermassive black hole would not emit visible Hawking
 * radiation; this is a cinematic teaching cue, kept below disk brightness.
 */
export function HawkingRadiation({ eventHorizonRadius, count = 36 }: HawkingRadiationProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      positions[index * 3] = Math.cos(theta) * radial;
      positions[index * 3 + 1] = z;
      positions[index * 3 + 2] = Math.sin(theta) * radial;
      phases[index] = Math.random();
      sizes[index] = 0.45 + Math.random() * 0.7;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    bufferGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return bufferGeometry;
  }, [count, eventHorizonRadius]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uEventHorizonRadius: { value: eventHorizonRadius } }),
    [eventHorizonRadius]
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    // Points on the far side stay behind the event horizon rather than bleeding
    // through it, while the visible hemisphere gently follows the viewer.
    if (pointsRef.current) pointsRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={3}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
