uniform float uTime;
uniform float uProgress;
varying vec3 vLocal;
varying vec3 vNormalView;
varying vec3 vViewDir;
varying float vTidal;

void main() {
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(vViewDir);
  // Fresnel only: the aura lives on the silhouette, never as a milky fill.
  float fres = pow(1.0 - abs(dot(N, V)), 3.0);

  float bloomIn = smoothstep(0.36, 0.48, uProgress);
  // Fade with the suit: an empty shell around vanishing sparks looks wrong.
  float burnOff = 1.0 - smoothstep(0.60, 0.70, uProgress);

  // Energy racing along the stretched body.
  float flow = vLocal.y * 9.0 - uTime * 6.0;
  float bands = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(flow), 2.0);

  float ang = atan(vLocal.x, vLocal.z);
  float filaments = pow(0.5 + 0.5 * sin(ang * 9.0 + vLocal.y * 6.0 - uTime * 2.2), 4.0);

  // Smooth interference tear so the shell breaks up instead of shimmering
  // uniformly.
  float tearing = 0.5 + 0.5 * sin(vLocal.y * 21.0 + uTime * 2.6) * sin(ang * 7.0 + vLocal.y * 11.0 - uTime * 1.9);
  float breakup = 0.45 + 0.55 * tearing;

  float energy = fres * (0.5 + bands * 0.65 + filaments * 0.85) * breakup;
  energy *= bloomIn * burnOff * vTidal;

  // Extremities run hotter than the waist.
  float tip = smoothstep(0.25, 1.0, abs(vLocal.y));
  vec3 col = mix(vec3(0.22, 0.66, 1.0), vec3(1.0, 0.62, 0.22), tip);
  col += vec3(1.0, 0.95, 0.88) * fres * 0.15;

  float alpha = clamp(energy * 0.3, 0.0, 0.55);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
}
