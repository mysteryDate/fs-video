// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
#define pulse(x, y, z, a) smoothstep(x-z, x+z, a) * smoothstep(y+z, y-z, a)
#define PI 3.14159

float cubicInOut(float k) {
  if ((k *= 2.0) < 1.0) {
    return 0.5 * k * k * k;
  }
  return 0.5 * ((k -= 2.0) * k * k + 2.0);
}
//
// float elasticOut(float k) {
//   if (k === 0) {
//     return 0;
//   }
//   if (k === 1) {
//     return 1;
//   }
//   return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
// }

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main()
{

  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv * 2.0 - 1.0; // remap to [-1, 1]
  uv = rotate(-PI/2.0) * uv;
  float theta = angle(uv);

  // x[n] = r * cos(2*pi*n/N)
  // y[n] = r * sin(2*pi*n/N)

  float r = 0.5;
  float numSides = 10.0;
  float i = floor(mod(iGlobalTime * numSides, numSides));
  // i = 1.0;
  // float i = 5.0;
  vec2 center = r * vec2(cos(2.0 * PI * i / numSides), sin(2.0 * PI * i / numSides));
  float d = 1.0 - dot(uv - center, uv - center);
  d = 20000.0 * (d - 0.999);

  gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
}
