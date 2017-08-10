// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
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

void main()
{
  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv * 2.0 - 1.0; // remap to [-1, 1]
  uv = rotate(PI/2.0) * uv;
  float theta = angle(uv);
  theta = (theta / (2.0 * PI)) + 0.5; // normalize theta [0, 1]

  // x[n] = r * cos(2*pi*n/N)
  // y[n] = r * sin(2*pi*n/N)

  // float numSides = 5.0;
  float R = 0.5;
  // float numSides = max(5.0 * (sin(iGlobalTime)/2.0 + 0.5), 0.01);
  float maxSides = 4.0;
  float duration = 5.0;
  float normTime = mod(iGlobalTime, duration) / duration;
  // normTime = pow(normTime, 3.0);
  float numSides = (1.0 - 2.0 * abs(normTime - 0.5)) * maxSides;
  numSides = floor(numSides) + cubicInOut(fract(numSides));
  float fractTheta = mod(theta, 1.0/numSides) * numSides;
  float zone = theta * numSides - fractTheta;
  vec3 color = getRandomVec3(zone + 1.0);

  float r = length(uv) / abs(fractTheta - 0.5);
  r = stroke(1.8, 0.2  * numSides, r);
  // float r = 1.0;

  vec3 c2 = getRandomVec3(floor(numSides) + floor(iGlobalTime * 2.0 * maxSides));

  gl_FragColor = vec4(mix(vec3(r - c2), c2, mod(iGlobalTime, 10.0)/5.0), 1.0);
}
