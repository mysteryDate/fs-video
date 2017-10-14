// vec2 iResolution
#define PI 3.14159
#define pulse(x, y, z, a) smoothstep(x-z, x+z, a) * smoothstep(y+z, y-z, a)

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

float triSDF(vec2 st) {
  st = 2.0 * (2.0 * st - 1.0);
  return max(abs(st.x) * 0.866025 + st.y * 0.5, -st.y * 0.5);
}

float fill(float x, float size) {
  return 1.0 - step(size, x);
}

float rotatedCross(vec2 st, float theta) {
  vec2 rotSt = rotateAboutPoint(st, theta, vec2(0.5));
  return crossSDF(rotSt, 1.0);
}

float sharpness = 0.2;
float width = 0.8;
void main() {
  vec3 color = vec3(0.0);
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  // st *= 1.5;
  // st = rotateAboutPoint(st, u_time, vec2(0.5));

  width = u_mouse.x;
  sharpness = u_mouse.y;
  // color += 1.0;
  // float cross = crossSDF(st, 0.5);
  float cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 4.0));
  color.r += pulse(0.5 - width/2.0, 0.5 + width/2.0, sharpness, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 2.0));
  color.g += pulse(0.5 - width/2.0, 0.5 + width/2.0, sharpness, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));
  cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / (1.0)));
  color.b += pulse(0.5 - width/2.0, 0.5 + width/2.0, sharpness, fract(cross * 1.0 * (sin(u_time / 4.0) + 1.1)));

  // color += pulse(0.3, 0.8, 0.2, fract(cross));
  float edgeBlur = 0.1;
  float rectMask = rectSDF(st, vec2(1.0));
  float triMask = triSDF(rotateAboutPoint(st - vec2(0.1, 0.0), PI/2.0, vec2(0.5))) + 0.2;
  color *= smoothstep(1.0, 1.0 - edgeBlur, mix(rectMask, triMask, sin(u_time)/2.0 + 0.5));
  gl_FragColor = vec4(color * (sharpness/2.0 + 1.0), 1.0);
  // gl_FragColor = vec4(color, 1.0);
}
