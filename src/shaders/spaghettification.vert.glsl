uniform float uTime;
uniform float uProgress;
varying vec3 vLocal;
varying vec3 vNormalView;
varying vec3 vViewDir;
varying float vTidal;

// The suit's non-uniform stretch is applied by the parent group, so the aura
// only needs plasma displacement. Keeping the shell tight around the body is
// what stops it from reading as a glowing cocoon.
void main() {
  vec3 p = position;
  float tidal = smoothstep(0.36, 0.60, uProgress);
  vTidal = tidal;

  vec3 n = normalize(normal);
  float ripple = sin(p.y * 9.0 + uTime * 3.1) * 0.035
               + sin(p.x * 12.0 - uTime * 2.3) * 0.018;
  p += n * ripple * tidal;

  vLocal = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormalView = normalize(normalMatrix * n);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
