uniform float uProgress;
varying float vEnergy;
void main() {
  float alpha = smoothstep(0.52, 0.9, uProgress) * (0.25 + vEnergy * 0.45);
  gl_FragColor = vec4(mix(vec3(0.15, 0.75, 1.0), vec3(1.0, 0.42, 0.08), vEnergy), alpha);
}
