varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}