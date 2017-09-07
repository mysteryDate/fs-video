"use strict";

var AUDIO_DELAY = 3600; // ms between start of video and audio

// THREE.js stuff
var container;
var renderer;
var camera;
var scene;

// Materials and textures
var videoTextures = [];
var barMaterials = [];

// Our media
var videoClips = document.getElementsByClassName("videoClip");
var audioClips = document.getElementsByClassName("audioClip");
var readyStates = {};
for (var i = 0; i < audioClips.length; i++) {
  readyStates[audioClips[i].id] = false;
}
for (var i = 0; i < videoClips.length; i++) {
  readyStates[videoClips[i].id] = false;
}

// Counters and UI
var playHead = 0;
var size;
var mousePosition = new THREE.Vector2();

function makeBarMaterial(options) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_playing: {value: true},
      u_mouseOver: {value: false},
      u_videoTexture: {value: options.video},
      u_resolution: {value: options.resolution || new THREE.Vector2(1, 1)},
      u_isColor: {value: true},
    },
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
      uniform sampler2D u_videoTexture;
      uniform vec2 u_resolution;
      uniform bool u_mouseOver;
      uniform bool u_isColor;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec3 tex = texture2D(u_videoTexture, uv).rgb;
        if (u_mouseOver == true) {
          tex += vec3(0.5);
        }
        if (u_isColor == false) {
          tex = vec3(length(tex)/3.0);
        }
        gl_FragColor = vec4(tex, 1.0);
      }
    `
  });
}

function init() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  for (var i = 0; i < videoClips.length; i++) {
    var vt = new THREE.VideoTexture(videoClips[i]);
    vt.minFilter = vt.magFilter = THREE.NearestFilter;
    vt.format = THREE.RGBFormat;
    videoTextures.push(vt);
  }

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100);
  camera.position.set(0.5, 0.5, 50);
  scene = new THREE.Scene();

  size = renderer.getSize();
  var dpr = renderer.getPixelRatio();
  for (var i = 0; i < audioClips.length; i++) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    var mat = makeBarMaterial({
      video: videoTextures[0],
      resolution: new THREE.Vector2(size.width * dpr, size.height * dpr),
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = THREE.Math.mapLinear(i, 0, audioClips.length, 0, 1);
    mesh.position.x += 0.5/audioClips.length;
    mesh.position.y = 0.5;
    scene.add(mesh);
    barMaterials.push(mat);
  }
}

function addPlayCounter(event) {
  readyStates[event.target.id] = true;
  // console.log(event);

  var readyToPlay = (Object.values(readyStates).indexOf(false) == -1);
  if (readyToPlay) {
    for (var i = 0; i < videoClips.length; i++) {
      videoClips[i].play();
      videoClips[i].volume = 0;
    }
    setTimeout(function() {
      for (var i = 0; i < audioClips.length; i++) {
        // audioClips[i].play();
      }
    }, AUDIO_DELAY);
  }
}

// This doesn't acutally work
function sync(time) {
  playHead = (time !== undefined) ? time : audioClips[0].currentTime;
  for (var i = 0; i < audioClips.length; i++) {
    readyStates[audioClips[i].id] = false;
    audioClips[i].pause();
    audioClips[i].currentTime = playHead;
  }
}

function printCurrentTimes() {
  for (var i = 0; i < audioClips.length; i++) {
    console.log(audioClips[i].currentTime);
  }
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

document.addEventListener("click", onDocumentClick, false);
document.addEventListener("mousemove", onDocumentMouseMove, false);
function onDocumentClick(event) {
  event.preventDefault();

  size = renderer.getSize();
  mousePosition.x = event.clientX / size.width;
  mousePosition.y = 1 - event.clientY / size.height;
  var hoverOver = Math.floor(mousePosition.x * audioClips.length);

  if (audioClips[hoverOver].volume == 1) {
    audioClips[hoverOver].volume = 0;
  } else {
    audioClips[hoverOver].volume = 1;
  }

  barMaterials[hoverOver].uniforms.u_playing.value = !barMaterials[hoverOver].uniforms.u_playing.value;
  if (barMaterials[hoverOver].uniforms.u_playing.value === true) {
    barMaterials[hoverOver].uniforms.u_videoTexture.value = videoTextures[0];
    barMaterials[hoverOver].uniforms.u_isColor.value = true;
  } else {
    barMaterials[hoverOver].uniforms.u_videoTexture.value = videoTextures[1];
    barMaterials[hoverOver].uniforms.u_isColor.value = false;
  }
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  size = renderer.getSize();
  mousePosition.x = event.clientX / size.width;
  mousePosition.y = 1 - event.clientY / size.height;

  var hoverOver = Math.floor(mousePosition.x * audioClips.length);

  for (var i = 0; i < barMaterials.length; i++) {
    barMaterials[i].uniforms.u_mouseOver.value = false;
    if (i == hoverOver) {
      barMaterials[i].uniforms.u_mouseOver.value = true;
    }
  }
}

init();
animate();
