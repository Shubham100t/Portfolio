precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldTangent;
varying float vRadius;
varying float vAngle;

uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uPhotonRadius;
uniform float uDopplerStrength;

// Fast procedural noise
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

// 4-octave Fractional Brownian Motion for plasma filaments
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
  float r = vRadius;
  
  if (r < uInnerRadius || r > uOuterRadius) {
    discard;
  }
  
  float normR = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  
  // 1. KEPLERIAN DIFFERENTIAL ROTATION: omega ~ 1 / r^1.5
  float keplerianOmega = 2.4 / pow(r, 1.5);
  float dynamicAngle = vAngle - uTime * keplerianOmega;
  
  // 2. LOGARITHMIC SPIRAL PLASMA TURBULENCE
  float logR = log(r);
  vec2 spiralCoords = vec2(dynamicAngle * 3.5 - logR * 6.0, r * 2.2);
  float plasmaTurbulence = fbm(spiralCoords);
  
  vec2 microCoords = vec2(dynamicAngle * 8.0 - logR * 12.0, r * 5.0 + uTime * 0.2);
  float microFilaments = fbm(microCoords) * 0.5 + 0.5;
  
  float plasmaDensity = smoothstep(0.15, 0.85, plasmaTurbulence) * microFilaments;
  
  // 3. RADIAL INTENSITY ENVELOPE
  float innerFalloff = smoothstep(uInnerRadius, uInnerRadius + 0.35, r);
  float outerFalloff = 1.0 - smoothstep(uOuterRadius - 1.2, uOuterRadius, r);
  float radialPeak = exp(-pow(normR * 2.6, 1.4));
  float baseDensity = innerFalloff * outerFalloff * (0.35 + 0.65 * radialPeak);
  
  // 4. RELATIVISTIC DOPPLER BEAMING & BLUESHIFT/REDSHIFT
  vec3 worldTangent = normalize(vWorldTangent);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  
  float cosAlpha = dot(worldTangent, viewDir);
  float beta = clamp(sqrt(uInnerRadius * 0.85 / (2.0 * r)), 0.05, 0.65);
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float dopplerFactor = 1.0 / (gamma * (1.0 - beta * cosAlpha));
  
  float dopplerBoost = pow(dopplerFactor, 3.2);
  dopplerBoost = mix(1.0, dopplerBoost, uDopplerStrength);
  
  // 5. THERMAL SPECTRAL COLORS
  vec3 colorWhiteHot  = vec3(1.0, 0.98, 0.94);
  vec3 colorCyanHot   = vec3(0.68, 0.88, 1.0);
  vec3 colorGoldHot   = vec3(1.0, 0.76, 0.22);
  vec3 colorOrange    = vec3(0.96, 0.44, 0.08);
  vec3 colorCrimson   = vec3(0.55, 0.08, 0.04);
  vec3 colorDarkSmoke = vec3(0.12, 0.02, 0.01);
  
  float temp = (1.0 - normR) * 0.7 + (dopplerFactor - 1.0) * 0.65;
  
  vec3 plasmaColor;
  if (temp > 0.85) {
    plasmaColor = mix(colorGoldHot, colorWhiteHot, (temp - 0.85) / 0.5);
  } else if (temp > 0.5) {
    plasmaColor = mix(colorOrange, colorGoldHot, (temp - 0.5) / 0.35);
  } else if (temp > 0.2) {
    plasmaColor = mix(colorCrimson, colorOrange, (temp - 0.2) / 0.3);
  } else {
    plasmaColor = mix(colorDarkSmoke, colorCrimson, max(temp, 0.0) / 0.2);
  }
  
  if (cosAlpha > 0.3) {
    plasmaColor = mix(plasmaColor, colorCyanHot, (cosAlpha - 0.3) * 0.35 * uDopplerStrength);
  }
  
  // 6. INCANDESCENT PHOTON RING SPIKE AT 1.5 Rs
  float photonDist = abs(r - uPhotonRadius);
  float photonSpike = exp(-pow(photonDist / 0.075, 2.0)) * 2.8;
  vec3 photonColor = vec3(1.0, 0.94, 0.82) * photonSpike;
  
  // 7. COMPOSITION & RADIANCE
  vec3 finalColor = (plasmaColor * plasmaDensity * baseDensity * dopplerBoost) + photonColor;
  float alpha = clamp(baseDensity * (plasmaDensity * 0.85 + 0.25) * (0.6 + 0.4 * dopplerBoost) + photonSpike * 0.9, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, alpha);
}
