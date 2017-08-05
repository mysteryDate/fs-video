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
  float numSides = 10.0 * (sin(iGlobalTime)/2.0 + 0.5) + sqrt(3.0);
  // numSides = floor(numSides) + cubicInOut(fract(numSides));
  numSides = numSides * numSides;
  // numSides = 3.;
  float shape = PI * 2.0/numSides;
  // numSides = 1.3;

  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv * 2.0 - 1.0; // remap to [-1, 1]
  // uv *= shape;
  // uv *= rotate(PI);// * rotate(numSides / 2.0);
  // uv.x = abs(uv.x);

  float theta = angle(uv);

  // c = pulse(0.49, 0.5, 0.005, shape);
  float c = theta/shape;
  c = floor(0.5 + c) * shape;
  c = c - theta;
  c = cos(c);
  // c = cos(c - theta);
  // float c = cos(floor(0.5 + theta/r)*r - theta) * length(uv);
  // c = pulse(0.9, 1.0, 0.01, theta);
  c *= length(uv);
  // c = numSides/100.;
  c = pulse(0.49, 0.5, 0.0001, c);

  float circ = length(uv);
  circ = pulse(0.49, 0.5, 0.001, circ);

  // c = abs(dot(uv.x, uv.y)) * 20.;

  gl_FragColor = vec4(c, circ, 0.0, 1.0);
}
