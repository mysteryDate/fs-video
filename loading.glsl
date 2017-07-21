// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
#define pulse(x, y, z, a) smoothstep(x-z, x+z, a) * smoothstep(y+z, y-z, a)
#define PI 3.14159

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main()
{
  float numSides = mod(iGlobalTime, 10.0) + 3.0;
  numSides = 10.0 * (sin(iGlobalTime)/2.0 + 0.5) + 3.0;
  float r = PI * 2.0/numSides;
  // numSides = 1.3;

  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv * 2.0 - 1.0; // remap to [-1, 1]
  // uv *= r;
  // uv *= rotate(PI);// * rotate(numSides / 2.0);
  // uv.x = abs(uv.x);

  float theta = angle(uv);

  // c = pulse(0.49, 0.5, 0.005, r);
  float c = cos(floor(0.5 + theta/r)*r - theta) * length(uv);
  // c = pulse(0.9, 1.0, 0.01, theta);
  c = pulse(0.49, 0.5, 0.0001, c);

  float circ = length(uv);
  circ = pulse(0.49, 0.5, 0.001, circ);

  // c = abs(dot(uv.x, uv.y)) * 20.;

  gl_FragColor = vec4(c, circ, 0.0, 1.0);
}
