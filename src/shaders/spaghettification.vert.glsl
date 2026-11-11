uniform float uTime;
uniform float uProgress;
varying float vEnergy;

// Phase 4: tidal displacement is evaluated on the GPU so the silhouette
// elongates toward the singularity without touching the persistent particle set.
void main() {
  vec3 p = position;
  float wave = sin(p.y * 7.0 + uTime * 4.0) * 0.12;
  float tidal = smoothstep(0.55, 0.95, uProgress);
  p.y *= 1.0 + tidal * 4.5;
  p.x *= 1.0 - tidal * 0.58;
  p.z *= 1.0 - tidal * 0.58;
  p.x += wave * tidal;
  vEnergy = tidal + abs(wave) * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
