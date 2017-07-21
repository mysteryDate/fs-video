// vec2 iResolution
// vec2 iMouse
// float iGlobalTime

#define polar(a) vec2(cos(a),sin(a))
#define rotate(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define angle(st) atan(st.y, st.x)
#define pulse(x, y, z, a) smoothstep(x, x+z, a) * smoothstep(y, y-z, a)
#define PI 3.14159

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main()
{
  float numSides = mod(iGlobalTime, 10.0);
  
  vec2 uv = gl_FragCoord.xy/iResolution.xy;
  uv = uv - vec2(0.5); // Center it
  uv *= rotate(-PI/2.0) ;

  float theta = angle(uv);
  theta = map(theta, -PI, PI, 0.0, 1.0);
  float r = length(uv);

  float c = mod(theta, 1.0/numSides) * numSides;
  c = pulse(0.9, 1.0, 0.01, c);
  c *= pulse(0.4, 0.5, 0.05, r);

  gl_FragColor = vec4(c, 0.0, 0.0, 1.0);
}
