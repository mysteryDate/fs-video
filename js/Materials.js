"use strict";

var Materials = {};
Materials.loadingIcon = function() {
  return new THREE.ShaderMaterial({
    name: "loading",
    uniforms: {
      u_mouse: {value: new THREE.Vector2(0, 0)},
      u_time: {value: 0},
      u_state: {value: 0},
    },
    vertexShader: `
      varying vec2 v_uv;
      void main() {
        v_uv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 v_uv;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform int u_state;
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
        vec2 st = v_uv;

        if (u_state == 0) {
          sharpness = u_mouse.y;
          width = u_mouse.x;
        }
        if (u_state == 1) {
          sharpness = u_mouse.y;
          center = u_mouse.x;
        }
        if (u_state == 2) {
          width = u_mouse.y;
          center = u_mouse.x;
        }

        float cross = crossSDF(st, 0.6 + 0.5 * sin(u_time / 4.0));
        color.r += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
        cross = crossSDF(st, 0.6 + 0.2 * sin(u_time / 2.0));
        color.g += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
        cross = crossSDF(st, 0.6 + 0.1 * sin(u_time / 1.0));
        color.b += pulse(center, width, sharpness, fract(cross * (sin(u_time / 4.0) + 1.1)));
        color *= sharpness/2.0 + 1.0;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
};

Materials.bar = function(options) {
  var colors = [
    new THREE.Color(0xffff00),
    new THREE.Color(0x00ff00),
    new THREE.Color(0xff00ff),
    new THREE.Color(0xff0000),
    new THREE.Color(0x00ffff),
  ];
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      u_playing: {value: true},
      u_mouseOver: {value: false},
      u_mouse: {value: new THREE.Vector2()},
      u_videoTexture: {value: options.video},
      u_opacity: {value: 0},
      u_color: {value: colors[options.index]},
      u_index: {value: options.index},
      u_clock: {value: 0},
    },
    vertexShader: `
      varying vec2 v_uv;
      void main() {
        v_uv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
      varying vec2 v_uv;
      uniform sampler2D u_videoTexture;
      uniform vec3 u_color;
      uniform vec2 u_mouse;
      uniform float u_opacity;
      uniform float u_index;
      uniform float u_clock;
      uniform bool u_mouseOver;

      const float NUM_BARS = 5.0;

      vec2 getRandomVec2(vec2 seed) {
        seed = vec2(dot(seed, vec2(0.040,-0.250)),
        dot(seed, vec2(269.5,183.3)));
        return -1.0 + 2.0 * fract(sin(seed) * 43758.633);
      }

      vec2 getRandomVec2(float seed) {
        return getRandomVec2(vec2(seed));
      }

      float gradientNoise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      vec2 u = smoothstep(0.0, 1.0, f);

      return mix(mix(dot(getRandomVec2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                     dot(getRandomVec2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                 mix(dot(getRandomVec2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                     dot(getRandomVec2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
      }

      float gradientNoise(float x) {
        return gradientNoise(vec2(x));
      }

      vec3 hsv2rgb(in vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        rgb = rgb * rgb * (3.0 - 2.0 * rgb);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }

      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      void main() {
        vec2 uv = v_uv;
        uv.x = (uv.x + u_index) / NUM_BARS;
        float noise = gradientNoise(uv * 5.0 + u_clock) * u_mouse.y;
        vec3 colorHSV = rgb2hsv(u_color);
        colorHSV.y = u_mouse.y;
        vec3 tex = texture2D(u_videoTexture, uv).rgb;
        if (u_mouseOver == true) {
          // tex = smoothstep(0.0, 0.1, rgb2hsv(tex).z);
          tex *= 2.0;
          // colorHSV.z += 0.2;
          // colorHSV.x += sin(u_clock);
          // colorHSV.y *= -1.0;
          // color *= u_color;
          // uv += noise/100.0;
        }
        vec3 color = hsv2rgb(colorHSV);
        tex *= color;
        gl_FragColor = vec4(tex, u_opacity);
      }
    `,
  });
};
