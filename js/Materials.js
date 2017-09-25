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
    new THREE.Color(0x0000ff),
  ];
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      u_playing: {value: true},
      u_mouseOver: {value: false},
      u_videoTexture: {value: options.video},
      u_opacity: {value: 0},
      u_color: {value: colors[options.index]},
      u_index: {value: options.index},
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
      uniform float u_opacity;
      uniform float u_index;
      uniform bool u_mouseOver;

      const float NUM_BARS = 5.0;

      void main() {
        vec2 uv = v_uv;
        uv.x = (uv.x + u_index) / NUM_BARS;
        vec3 tex = texture2D(u_videoTexture, uv).rgb;
        if (u_mouseOver == true) {
          tex *= u_color;
        }
        gl_FragColor = vec4(tex, u_opacity);
      }
    `
  });
};
