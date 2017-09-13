float pulse(float center, float width, float sharpness, float x) {
  float left = center - width / 2.0;
  float right = center + width / 2.0;
  float leftEdge = smoothstep(left - sharpness, left + sharpness, x);
  float rightEdge = smoothstep(right + sharpness, right - sharpness, x);
  return leftEdge * rightEdge;
}

float rectSDF(vec2 st, vec2 s) {
  st = st * 2.0 - 1.0;
  return max(abs(st.x/s.x), abs(st.y/s.y));
}

float crossSDF(vec2 st, float s) {
  vec2 size = vec2(0.25, s);
  return min(rectSDF(st, size.xy), rectSDF(st, size.yx));
}

float sharpness = 0.2;
float width = 0.2;
float center = 0.5;
void main() {
  vec3 color = vec3(0.0);
  vec2 st = gl_FragCoord.xy / iResolution.xy;

  // width = u_mouse.x;
  sharpness = u_mouse.y;
  center = u_mouse.x;

  float cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 4.0));
  color.r += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.2 * sin(u_time / 2.0));
  color.g += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.1 * sin(u_time / 1.0));
  color.b += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
  color *= sharpness/2.0 + 1.0;

  gl_FragColor = vec4(color, 1.0);
}
