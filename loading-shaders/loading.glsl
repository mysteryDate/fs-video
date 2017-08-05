// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
#define pulse(x, y, z, a) smoothstep(x-z, x+z, a) * smoothstep(y+z, y-z, a)
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
  // uv = rotate(-PI/2.0) * uv;
  float theta = angle(uv);
  theta = (theta / (2.0 * PI)) + 0.5; // normalize theta [0, 1]

  // x[n] = r * cos(2*pi*n/N)
  // y[n] = r * sin(2*pi*n/N)

  // float numSides = 5.0;
  float numSides = floor(mod(iGlobalTime, 10.0));
  float fractTheta = mod(theta, 1.0/numSides) * numSides;
  float zone = theta * numSides - fractTheta;
  vec3 color = getRandomVec3(zone + 1.0);

  gl_FragColor = vec4(color, 1.0);
}
