// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
#define cartesian(r, theta) vec2(r * cos(theta), r * sin(theta))
#define pulse(x, y, z, a) smoothstep(x-z, x+z, a) * smoothstep(y+z, y-z, a)
#define stroke(x, w, a) pulse(x - w/2., x + w/2., w/8., a)
#define PI 3.14159

vec3 getRandomVec3(float p) {
  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

float cubicInOut(float k) {
  if ((k *= 2.0) < 1.0) {
    return 0.5 * k * k * k;
  }
  return 0.5 * ((k -= 2.0) * k * k + 2.0);
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float shape(vec2 st, float n) {
  float theta = angle(st);
  float shape = PI * 2.0/n;
  float c = theta/shape;
  c = floor(0.5 + c) * shape;
  c = c - theta;
  c = cos(c);
  c *= length(st) / cos(PI/n);
  return c;
}

float shape2(vec2 st, float n) {
  float theta = angle(st);
  float r = cos(PI/n) / cos(mod(theta, 2.0*PI/n) - PI/2.0);
  return r;
}

void main()
{
  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv * 2.0 - 1.0; // remap to [-1, 1]
  uv = rotate(-PI/2.0) * uv;
  float theta = angle(uv);
  theta = (theta / (2.0 * PI)) + 0.5; // normalize theta [0, 1]

  // x[n] = r * cos(2*pi*n/N)
  // y[n] = r * sin(2*pi*n/N)

  float RADIUS = 0.4;
  // RADIUS = mod(iGlobalTime, 10.0)/10.0;
  float numSides = 6.0;
  numSides = mod(iGlobalTime, 6.0) + 3.0;
  float ratio = cos(PI/numSides);
  float width = 0.005;
  float fractTheta = mod(theta, 1.0/numSides) * numSides;
  float zone = (theta * numSides - fractTheta);

  float t1 = (zone - 0.5)/numSides * 2.0 * PI;
  float t2 = (zone - 1.5)/numSides * 2.0 * PI;

  vec2 p1 = cartesian(RADIUS, t1);
  vec2 p2 = cartesian(RADIUS, t2);

  vec2 point = cartesian(0.5, 0.);
  float d = 1.0 - distance(uv, p1);
  d = 999999. * (d - 0.99);
  float d2 = 1.0 - distance(uv, p2);
  d2 = 999999. * (d2 - 0.99);

  gl_FragColor = vec4(d, zone/numSides, d2, 1.0);
}
