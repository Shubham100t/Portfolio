precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec3 uBlackHolePosition;
uniform float uEventHorizonRadius;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uDopplerStrength;
uniform float uSphereRadius;

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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise2D(p);
    p = rot * p * 2.05 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

// Sample accretion disk plasma at hit position
vec4 sampleDisk(vec3 hitPos, float r, vec3 currentRayDir, vec3 tangentX, vec3 tangentZ) {
  float normR = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  
  float x = dot(hitPos, tangentX);
  float z = dot(hitPos, tangentZ);
  float angle = atan(z, x);
  
  // Keplerian differential rotation omega ~ 1 / r^1.5
  float omega = 2.4 / pow(r, 1.5);
  float dynamicAngle = angle - uTime * omega;
  
  // Logarithmic spiral coords
  float logR = log(r);
  vec2 spiralCoords = vec2(dynamicAngle * 3.5 - logR * 6.0, r * 2.2);
  float turbulence = fbm(spiralCoords);
  
  vec2 microCoords = vec2(dynamicAngle * 8.0 - logR * 12.0, r * 5.0 + uTime * 0.2);
  float micro = fbm(microCoords) * 0.5 + 0.5;
  float plasmaDensity = smoothstep(0.18, 0.85, turbulence) * micro;
  
  // Radial boundaries
  float innerFalloff = smoothstep(uInnerRadius, uInnerRadius + 0.35, r);
  float outerFalloff = smoothstep(uOuterRadius, uOuterRadius - 1.2, r);
  float radialPeak = exp(-pow(normR * 2.6, 1.4));
  float baseDensity = innerFalloff * outerFalloff * (0.35 + 0.65 * radialPeak);
  
  // Relativistic Doppler beaming
  vec3 vOrbit = normalize(-tangentX * sin(angle) + tangentZ * cos(angle));
  float cosAlpha = dot(vOrbit, -currentRayDir);
  
  float beta = clamp(sqrt(uInnerRadius * 0.85 / (2.0 * r)), 0.05, 0.65);
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float dopplerFactor = 1.0 / (gamma * (1.0 - beta * cosAlpha));
  float dopplerBoost = pow(dopplerFactor, 3.2);
  dopplerBoost = mix(1.0, dopplerBoost, uDopplerStrength);
  
  // Spectral colors
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
  
  // Photon ring spike at 1.5 Rs
  float photonRadius = uEventHorizonRadius * 1.5;
  float photonDist = abs(r - photonRadius);
  float photonSpike = exp(-pow(photonDist / 0.075, 2.0)) * 2.8;
  vec3 photonColor = vec3(1.0, 0.94, 0.82) * photonSpike;
  
  vec3 finalColor = (plasmaColor * plasmaDensity * baseDensity * dopplerBoost) + photonColor;
  float alpha = clamp(baseDensity * (plasmaDensity * 0.85 + 0.25) * (0.6 + 0.4 * dopplerBoost) + photonSpike * 0.9, 0.0, 1.0);
  
  return vec4(finalColor, alpha);
}

void main() {
  vec3 rayDir = normalize(vWorldPosition - uCameraPosition);
  vec3 p0 = uCameraPosition - uBlackHolePosition;
  
  // Tilted disk frame of reference (cinematic 12-degree tilt)
  vec3 nDisk = normalize(vec3(0.06, 0.98, 0.12));
  vec3 tangentX = normalize(cross(nDisk, vec3(0.0, 0.0, 1.0)));
  vec3 tangentZ = normalize(cross(tangentX, nDisk));
  
  // Find ray entry into bounding sphere
  float b = dot(p0, rayDir);
  float c = dot(p0, p0) - uSphereRadius * uSphereRadius;
  float h = b * b - c;
  if (h < 0.0) discard;
  
  float tNear = -b - sqrt(h);
  vec3 pos = p0 + rayDir * max(tNear, 0.0);
  vec3 dir = rayDir;
  
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  bool hitHorizon = false;
  
  const int MAX_STEPS = 48;
  for (int i = 0; i < MAX_STEPS; i++) {
    float r = length(pos);
    
    // 1. Absorbed by event horizon?
    if (r < uEventHorizonRadius) {
      hitHorizon = true;
      break;
    }
    
    // Adaptive step size
    float stepSize = max(0.055, r * 0.075);
    
    // 2. Relativistic light deflection: d(dir)/ds = -1.5 * Rs * pos / r^3
    vec3 accel = -1.5 * uEventHorizonRadius * pos / (r * r * r);
    vec3 nextDir = normalize(dir + accel * stepSize);
    vec3 nextPos = pos + dir * stepSize;
    
    // 3. Crossing check with accretion disk plane
    float d1 = dot(pos, nDisk);
    float d2 = dot(nextPos, nDisk);
    
    if (d1 * d2 <= 0.0) {
      float tHit = -d1 / (d2 - d1);
      vec3 hitPos = mix(pos, nextPos, tHit);
      float diskR = length(hitPos - dot(hitPos, nDisk) * nDisk);
      
      if (diskR >= uInnerRadius && diskR <= uOuterRadius) {
        vec4 sampleCol = sampleDisk(hitPos, diskR, nextDir, tangentX, tangentZ);
        accumColor += sampleCol.rgb * (1.0 - accumAlpha) * sampleCol.a;
        accumAlpha += sampleCol.a * (1.0 - accumAlpha);
        if (accumAlpha > 0.98) break;
      }
    }
    
    // 4. Photon ring caustic glow near 1.5 Rs
    float pDist = abs(r - uEventHorizonRadius * 1.5);
    if (pDist < 0.18) {
      float glow = exp(-pow(pDist / 0.06, 2.0)) * 0.1;
      accumColor += vec3(1.0, 0.94, 0.8) * glow * (1.0 - accumAlpha);
      accumAlpha += glow * 0.45;
    }
    
    pos = nextPos;
    dir = nextDir;
    
    if (length(pos) > uSphereRadius * 1.05) break;
  }
  
  if (hitHorizon) {
    // Event horizon core: absorb light and render black
    gl_FragColor = vec4(accumColor * (1.0 - (1.0 - accumAlpha)), 1.0);
    return;
  }
  
  if (accumAlpha < 0.01) {
    discard; // Transparent void: allows background stars to be visible
  }
  
  gl_FragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));
}