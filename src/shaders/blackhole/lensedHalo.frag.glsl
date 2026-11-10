precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec3 uDiskNormal;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uPhotonRadius;
uniform float uDopplerStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise2D(p);
    p = rot * p * 2.05 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  float r = length(vLocalPosition.xy);
  
  if (r < uInnerRadius || r > uOuterRadius) {
    discard;
  }
  
  float angle = atan(vLocalPosition.y, vLocalPosition.x);
  float normR = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  
  // 1. VERTICAL LENSED ENVELOPE: light bent over top and bottom
  // Maximum at top (angle ~ PI/2) and bottom (angle ~ -PI/2)
  float verticalWeight = pow(abs(sin(angle)), 0.9);
  
  // 2. INCLINATION MODULATION
  // Halo is strongest when viewing edge-on; fades when looking straight down from pole
  vec3 viewDir = normalize(uCameraPosition);
  float cosInc = abs(dot(viewDir, normalize(uDiskNormal)));
  // Gravitationally lensed light remains observable from every camera angle.
  // Edge-on views become more dramatic, but never vanish into a hard cutoff.
  float inclinationWeight = mix(0.42, 1.0, 1.0 - pow(cosInc, 1.4));
  
  // 3. KEPLERIAN PLASMA TURBULENCE
  float omega = 2.2 / pow(r, 1.5);
  float dynamicAngle = angle - uTime * omega;
  float logR = log(r);
  vec2 spiralCoords = vec2(dynamicAngle * 4.0 - logR * 6.0, r * 2.5);
  float turbulence = fbm(spiralCoords);
  float plasmaDensity = smoothstep(0.18, 0.82, turbulence);

  // A restrained moving caustic ripple makes the bent rear light read as
  // spacetime distortion rather than a static decorative arc.
  float lensRipple = 0.84 + 0.16 * sin(dynamicAngle * 9.0 + logR * 7.0);
  
  // 4. RADIAL FALLOFF
  float innerFalloff = smoothstep(uInnerRadius, uInnerRadius + 0.25, r);
  float outerFalloff = 1.0 - smoothstep(uOuterRadius - 0.8, uOuterRadius, r);
  float radialPeak = exp(-pow(normR * 2.2, 1.5));
  float baseDensity = innerFalloff * outerFalloff * (0.3 + 0.7 * radialPeak);
  
  // 5. RELATIVISTIC DOPPLER FREQUENCY SHIFT
  // Approaching side (left when sin(angle) > 0 and x < 0) boosted, right side dimmed
  float dopplerFactor = 1.0 - (vLocalPosition.x / r) * 0.45 * uDopplerStrength;
  float dopplerBoost = pow(max(dopplerFactor, 0.2), 3.0);
  
  // 6. SPECTRAL COLORS
  vec3 colorWhiteHot = vec3(1.0, 0.98, 0.94);
  vec3 colorCyanHot  = vec3(0.68, 0.88, 1.0);
  vec3 colorGoldHot  = vec3(1.0, 0.76, 0.22);
  vec3 colorOrange   = vec3(0.96, 0.44, 0.08);
  vec3 colorCrimson  = vec3(0.55, 0.08, 0.04);
  
  float temp = (1.0 - normR) * 0.75 + (dopplerBoost - 1.0) * 0.4;
  vec3 plasmaColor = mix(colorOrange, colorGoldHot, clamp(temp, 0.0, 1.0));
  if (temp > 0.8) {
    plasmaColor = mix(colorGoldHot, colorWhiteHot, (temp - 0.8) / 0.4);
  }
  if (dopplerBoost > 1.3) {
    plasmaColor = mix(plasmaColor, colorCyanHot, 0.3);
  }
  
  // 7. PHOTON RING SPIKE AT 1.5 Rs
  float photonDist = abs(r - uPhotonRadius);
  float photonSpike = exp(-pow(photonDist / 0.08, 2.0)) * 2.2;
  vec3 photonColor = vec3(1.0, 0.94, 0.85) * photonSpike;
  
  // 8. COMBINED INTENSITY
  float totalWeight = verticalWeight * inclinationWeight * lensRipple;
  vec3 finalColor = (plasmaColor * plasmaDensity * baseDensity * dopplerBoost + photonColor) * totalWeight;
  float alpha = clamp((baseDensity * plasmaDensity * 0.9 + photonSpike * 0.85) * totalWeight * (0.5 + 0.5 * dopplerBoost), 0.0, 1.0);
  
  if (alpha < 0.008) discard;
  
  gl_FragColor = vec4(finalColor, alpha);
}
