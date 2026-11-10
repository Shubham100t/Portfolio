precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 uCameraPosition;
uniform vec3 uBlackHolePosition;
uniform float uEventHorizonRadius;
uniform float uLensRadius;
uniform float uStrength;
uniform float uTime;

void main() {
  // Ray from camera to current fragment on the lensing boundary sphere
  vec3 rayOrigin = uCameraPosition;
  vec3 rayDir = normalize(vWorldPosition - rayOrigin);
  
  // Vector from ray origin to black hole center
  vec3 toCenter = uBlackHolePosition - rayOrigin;
  
  // Projection of center onto ray direction
  float tProjection = dot(toCenter, rayDir);
  vec3 closestPoint = rayOrigin + rayDir * tProjection;
  
  // Impact parameter b = distance of closest approach to singularity
  float b = length(closestPoint - uBlackHolePosition);
  
  // Schwarzschild event horizon boundary
  float Rs = uEventHorizonRadius;
  
  if (b < Rs) {
    // Inside event horizon: zero light escapes
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  // Relativistic deflection angle: alpha ~ 4GM / (c^2 * b) = 2Rs / b
  // Strong field correction near photon sphere
  float deltaB = max(b - Rs, 0.001);
  float deflection = (2.0 * Rs / deltaB) * uStrength;
  
  // Deflection direction: radially inwards toward singularity
  vec3 radialDir = normalize(closestPoint - uBlackHolePosition);
  vec3 deflectedRay = normalize(rayDir - radialDir * deflection * 0.12);
  
  // Einstein ring caustic glow near photon sphere (b ~ 1.5 Rs)
  float photonSphereDist = abs(b - Rs * 1.5);
  float einsteinRing = exp(-pow(photonSphereDist / 0.12, 2.0)) * 1.8;
  
  // Chromatic dispersion (gravitational red/blue fringe near critical boundary)
  vec3 causticColor = vec3(1.0, 0.88, 0.6) * einsteinRing;
  
  // Gravitational shadow edge smooth falloff
  float shadowMask = smoothstep(Rs, Rs + 0.08, b);
  float rimGlow = (1.0 - smoothstep(Rs, Rs * 2.2, b)) * 0.4;
  
  vec3 finalColor = causticColor + vec3(0.9, 0.6, 0.2) * rimGlow;
  float alpha = (1.0 - shadowMask) + einsteinRing * 0.8 + rimGlow * 0.3;
  
  gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
}