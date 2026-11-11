"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useUniverseStore } from "@/stores/useUniverseStore";
import { QUALITY_PRESETS } from "@/lib/quality";
import { sampleSuit } from "./AstronautDissolve";

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Solid suit fragments that tear free while the body fades. Each chunk is born
 * on the stretched suit surface, tumbles around the pull axis, and elongates as
 * it falls toward the singularity.
 */
export function AstronautDebris({ count }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const quality = useUniverseStore((s) => s.quality);
  const chunkCount =
    count ?? Math.max(14, Math.round(QUALITY_PRESETS[quality].dissolveParticles * 0.025));
  const { base, seeds } = useMemo(() => sampleSuit(chunkCount), [chunkCount]);

  const chunks = useMemo(
    () =>
      Array.from({ length: chunkCount }, (_, i) => {
        const seed = seeds[i];
        const ox = Math.random() - 0.5;
        const oy = Math.random() - 0.5;
        const oz = Math.random() - 0.5;
        const ol = Math.hypot(ox, oy, oz) || 1;
        return {
          x: base[i * 3],
          y: base[i * 3 + 1],
          z: base[i * 3 + 2],
          size: 0.05 + seed * 0.09,
          detach: 0.56 + seed * 0.08,
          spin: 1.2 + seed * 4.5,
          ox: ox / ol,
          oy: oy / ol,
          oz: oz / ol,
          seed,
        };
      }),
    [base, seeds, chunkCount]
  );

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.5,
        metalness: 0.3,
        emissive: new THREE.Color("#ff7a2f"),
        emissiveIntensity: 0.3,
      }),
    []
  );

  // Suit palette so fragments read as pieces of the actual EVA suit.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < chunkCount; i++) {
      const seed = seeds[i];
      if (seed < 0.5) color.set("#e9eff7");
      else if (seed < 0.72) color.set("#c6d1df");
      else if (seed < 0.86) color.set("#2f56c8");
      else if (seed < 0.95) color.set("#f0a13c");
      else color.set("#94a3b8");
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [chunkCount, seeds]);

  const scratch = useMemo(
    () => ({
      inverse: new THREE.Matrix4(),
      bhLocal: new THREE.Vector3(),
      dummy: new THREE.Object3D(),
      q: new THREE.Quaternion(),
      spinQ: new THREE.Quaternion(),
      dir: new THREE.Vector3(),
    }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const parent = mesh?.parent;
    if (!mesh || !parent) return;

    const progress = useUniverseStore.getState().cinematicProgress;
    const visible = progress > 0.54 && progress < 0.96;
    mesh.visible = visible;
    if (!visible) return;

    // The singularity in the astronaut's local space, matching the sparks'
    // convergence point even as the director moves and scales the group.
    parent.updateWorldMatrix(true, false);
    scratch.inverse.copy(parent.matrixWorld).invert();
    scratch.bhLocal.set(0, 0, 0).applyMatrix4(scratch.inverse);
    const { bhLocal, dummy, q, spinQ, dir } = scratch;
    const t = clock.getElapsedTime();

    for (let i = 0; i < chunkCount; i++) {
      const c = chunks[i];
      const k = THREE.MathUtils.clamp((progress - c.detach) / 0.2, 0, 1);
      const ease = k * k * (3 - 2 * k);

      let px = c.x + (bhLocal.x - c.x) * ease;
      let py = c.y + (bhLocal.y - c.y) * ease;
      let pz = c.z + (bhLocal.z - c.z) * ease;

      // A short outward peel before the fall reads as tearing off the suit.
      const peel = Math.sin(ease * Math.PI) * 0.22;
      px += c.ox * peel;
      py += c.oy * peel;
      pz += c.oz * peel;

      const rx = px - bhLocal.x;
      const rz = pz - bhLocal.z;
      const swirl = Math.sin(ease * Math.PI) * (0.18 + c.seed * 0.4);
      px += -rz * swirl;
      pz += rx * swirl;
      py += Math.sin(ease * Math.PI + c.seed * 6.0) * 0.16;

      const grow = THREE.MathUtils.smoothstep(k, 0, 0.12);
      const gone = 1 - THREE.MathUtils.smoothstep(k, 0.84, 1);
      const size = c.size * grow * gone;
      const stretch = 1 + ease * 1.6;

      dir.set(bhLocal.x - c.x, bhLocal.y - c.y, bhLocal.z - c.z).normalize();
      q.setFromUnitVectors(UP, dir);
      spinQ.setFromAxisAngle(dir, t * c.spin + c.seed * 6.28);
      q.multiply(spinQ);

      dummy.position.set(px, py, pz);
      dummy.quaternion.copy(q);
      dummy.scale.set(size, size * stretch, size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, chunkCount]}
      visible={false}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}
