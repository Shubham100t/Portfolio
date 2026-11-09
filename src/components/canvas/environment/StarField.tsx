"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Vertex shader for astronomical stars with distance attenuation and spectral colors
const starVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aTwinkleSpeed;
  attribute float aPhase;
  
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    
    // Natural twinkle oscillation
    float twinkle = sin(uTime * aTwinkleSpeed + aPhase) * 0.35 + 0.65;
    vAlpha = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation based on perspective depth
    gl_PointSize = aSize * (350.0 / -mvPosition.z) * (0.8 + 0.2 * twinkle);
    gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);
  }
`;

// Fragment shader for smooth circular Gaussian falloff stars (not square points)
const starFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Distance from point center [0.0, 1.0]
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;

    // Smooth gaussian radial falloff for realistic stellar glow
    float intensity = exp(-dist * dist * 14.0);
    
    // Inner bright stellar core
    float core = smoothstep(0.12, 0.0, dist) * 0.5;

    gl_FragColor = vec4(vColor + vec3(core), vAlpha * intensity);
  }
`;

export function StarField({ count = 7500 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const [positions, colors, sizes, twinkleSpeeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);

    // Harvard Spectral classification color palette
    const spectralColors = [
      new THREE.Color("#93c5fd"), // O/B: Intense Cyan / Deep Blue
      new THREE.Color("#bfdbfe"), // B: Blue-white
      new THREE.Color("#ffffff"), // A: Pure White
      new THREE.Color("#f8fafc"), // F: Warm White
      new THREE.Color("#fef08a"), // G: Solar Yellow
      new THREE.Color("#fed7aa"), // K: Light Orange
      new THREE.Color("#fca5a5"), // M: Red Giant
    ];

    for (let i = 0; i < count; i++) {
      // Uniform spherical distribution at cosmic distances (radius 250 to 900)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250 + Math.pow(Math.random(), 0.7) * 650;

      const sinPhi = Math.sin(phi);
      pos[i * 3 + 0] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Select spectral color (weighted towards white and blue-white)
      const colorRoll = Math.random();
      let pickedColor: THREE.Color;
      if (colorRoll < 0.45) pickedColor = spectralColors[2]; // White
      else if (colorRoll < 0.70) pickedColor = spectralColors[1]; // Blue-white
      else if (colorRoll < 0.85) pickedColor = spectralColors[0]; // Cyan
      else if (colorRoll < 0.95) pickedColor = spectralColors[4]; // Yellow
      else pickedColor = spectralColors[6]; // Red giant

      col[i * 3 + 0] = pickedColor.r;
      col[i * 3 + 1] = pickedColor.g;
      col[i * 3 + 2] = pickedColor.b;

      // Realistic astronomical magnitude distribution (mostly faint, few bright)
      const magnitudePower = Math.random();
      sz[i] = magnitudePower > 0.98 ? 3.8 : magnitudePower > 0.90 ? 2.4 : 1.2;

      spd[i] = 0.5 + Math.random() * 2.5;
      phs[i] = Math.random() * Math.PI * 2.0;
    }

    return [pos, col, sz, spd, phs];
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    // Extremely subtle galactic rotation
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0012;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aTwinkleSpeed"
          count={twinkleSpeeds.length}
          array={twinkleSpeeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
