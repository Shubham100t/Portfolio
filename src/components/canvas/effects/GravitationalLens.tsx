"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BlendFunction, Effect } from "postprocessing";

/**
 * Screen-space approximation of the binary's gravitational lens. The real
 * deflection grows as 1/r, so a fragment is sampled slightly closer to the
 * hole's projected centre — background stars, dust and the disk bend inward
 * while a masked band leaves the horizon itself untouched.
 */
const fragmentShader = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uTime;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Work in aspect-corrected space so the ring stays circular on every screen.
    vec2 p = (uv - uCenter) * vec2(uAspect, 1.0);
    float r = length(p);

    float inner = smoothstep(uRadius * 0.92, uRadius * 1.28, r);
    float outer = 1.0 - smoothstep(uRadius * 2.4, uRadius * 3.8, r);
    float band = inner * outer;

    // 1/r falloff, softened at the rim, masked so the photon ring is not smeared.
    float bend = (uRadius * uRadius) / max(r, uRadius * 1.02) * 0.18 * band * uStrength;
    bend *= 0.9 + 0.1 * sin(uTime * 0.7 + r * 30.0);

    vec2 dir = p / max(r, 1e-4);
    vec2 invAspect = vec2(1.0 / uAspect, 1.0);

    vec2 uvR = clamp(uv - dir * invAspect * bend * 1.035, vec2(0.001), vec2(0.999));
    vec2 uvG = clamp(uv - dir * invAspect * bend, vec2(0.001), vec2(0.999));
    vec2 uvB = clamp(uv - dir * invAspect * bend * 0.962, vec2(0.001), vec2(0.999));

    vec3 col = vec3(
      texture2D(inputBuffer, uvR).r,
      texture2D(inputBuffer, uvG).g,
      texture2D(inputBuffer, uvB).b
    );

    // Faint cool rim: keeps the photon ring readable without pushing to white.
    float rim = smoothstep(uRadius * 1.0, uRadius * 1.12, r) * (1.0 - smoothstep(uRadius * 1.12, uRadius * 1.42, r));
    col += vec3(0.35, 0.62, 1.0) * rim * 0.07 * uStrength;

    outputColor = vec4(mix(inputColor.rgb, col, band), inputColor.a);
  }
`;

class GravitationalLensEffect extends Effect {
  constructor() {
    super("GravitationalLensEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uCenter", new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ["uAspect", new THREE.Uniform(1)],
        ["uRadius", new THREE.Uniform(0.16)],
        ["uStrength", new THREE.Uniform(0)],
        ["uTime", new THREE.Uniform(0)],
      ]),
    });
  }

  setView(center: THREE.Vector2, aspect: number, radius: number, strength: number, time: number) {
    (this.uniforms.get("uCenter")!.value as THREE.Vector2).copy(center);
    this.uniforms.get("uAspect")!.value = aspect;
    this.uniforms.get("uRadius")!.value = radius;
    this.uniforms.get("uStrength")!.value = strength;
    this.uniforms.get("uTime")!.value = time;
  }
}

export function GravitationalLens({ eventHorizonRadius = 1.35 }: { eventHorizonRadius?: number }) {
  const { camera, size } = useThree();
  const effect = useMemo(() => new GravitationalLensEffect(), []);

  const center = useMemo(() => new THREE.Vector2(0.5, 0.5), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toHole = useMemo(() => new THREE.Vector3(), []);
  const clock = useMemo(() => new THREE.Clock(), []);

  useEffect(() => () => effect.dispose(), [effect]);

  useFrame(() => {
    camera.updateMatrixWorld();
    camera.getWorldDirection(forward);
    toHole.copy(camera.position).multiplyScalar(-1).normalize();

    const facing = forward.dot(toHole);
    const distance = Math.max(camera.position.length(), 0.001);

    projected.set(0, 0, 0).project(camera);
    center.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);

    const perspective = camera as THREE.PerspectiveCamera;
    const halfFov = THREE.MathUtils.degToRad(perspective.fov * 0.5);
    const ndcRadius = (eventHorizonRadius / distance) / Math.tan(halfFov);
    const radius = THREE.MathUtils.clamp(ndcRadius * 0.5 * 1.15, 0.0015, 1.5);
    const strength = THREE.MathUtils.smoothstep(facing, 0.18, 0.65);

    effect.setView(center, size.width / Math.max(size.height, 1), radius, strength, clock.getElapsedTime());
  });

  return <primitive object={effect} />;
}
