// vec2 iResolution
#define PI 3.14159

vec2 rotate(vec2 st, float theta) {
  mat2 rotationMatrix = mat2(cos(theta), sin(theta), -sin(theta), cos(theta));
  return rotationMatrix * st;
}

vec2 rotateAboutPoint(vec2 st, float theta, vec2 point) {
  return rotate(st - point, theta) + point;
}

float stroke(float x, float s, float w) {
  float d = step(s, x + w * 0.5) - step(s, x - w * 0.5);
  return clamp(d, 0.0, 1.0);
}

float circleSDF(vec2 st) {
  return length(st - 0.5) * 2.0;
}

float rectSDF(vec2 st, vec2 s) {
  st = st * 2.0 - 1.0;
  return max(abs(st.x/s.x), abs(st.y/s.y));
}

float crossSDF(vec2 st, float s) {
  vec2 size = vec2(0.25, s);
  return min(rectSDF(st, size.xy), rectSDF(st, size.yx));
}

float fill(float x, float size) {
  return 1.0 - step(size, x);
}

float rotatedCross(vec2 st, float theta) {
  vec2 rotSt = rotateAboutPoint(st, theta, vec2(0.5));
  return crossSDF(rotSt, 1.0);
}

void main() {
  vec3 color = vec3(0.0);
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  // st *= 1.5;
  // st = rotateAboutPoint(st, u_time, vec2(0.5));

  color += 1.0;
  float cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 2.0));
  color.r *= step(0.5, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 4.0));
  color.g *= step(0.5, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 1.0));
  color.b *= step(0.5, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));

  gl_FragColor = vec4(color, 1.0);
}
