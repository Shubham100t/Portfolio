varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldTangent;
varying float vRadius;
varying float vAngle;

uniform float uTime;

void main() {
  vUv = uv;
  
  // Local disk coordinates (centered at origin)
  vRadius = length(position.xy);
  vAngle = atan(position.y, position.x);
  
  // Transform normal to world space
  vNormal = normalize(mat3(modelMatrix) * normal);

  // Keplerian flow tangent (counter-clockwise) transformed to world space here,
  // because modelMatrix is not available in the fragment shader.
  vec3 localTangent = normalize(vec3(-position.y, position.x, 0.0));
  vWorldTangent = normalize(mat3(modelMatrix) * localTangent);
  
  // Compute world position
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  
  // Camera view vector in view space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}