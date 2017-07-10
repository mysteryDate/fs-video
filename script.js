"use strict";

var container;
var renderer;
var video;
var videoTexture;
var video2;
var videoTexture2;
var camera;
var scene;

var playCounter = 0;
var audioClips;
var playHead = 0;
var controls;
var size;
var mousePosition = new THREE.Vector2();
var materials = [];

function makeBarMaterial(options) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_color: {value: options.color || new THREE.Color("pink")},
      u_mousePos: {value: new THREE.Vector2(0, 0)},
      u_mouseOver: {value: false},
      u_playing: {value: true},
      u_videoTexture: {value: options.video},
      u_resolution: {value: options.resolution || new THREE.Vector2(1, 1)},
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
      uniform vec2 u_resolution;
      uniform vec2 u_mousePos;
      uniform vec3 u_color;
      uniform bool u_mouseOver;
      uniform bool u_playing;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec4 tex = texture2D(u_videoTexture, uv);
        // vec3 col = u_color;
        // if (u_playing == false) {
        //   col *= 0.1;
        // }
        vec3 col = vec3(0.0);
        if (u_mouseOver == true) {
          col += vec3(0.5);
        }
        gl_FragColor = vec4(col + tex.rgb, 1.0);
      }
    `
  });
}

function init() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer( { antialias: false } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  video = document.getElementById('base-video');
  video2 = document.getElementById('second-video');

  videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.NearestFilter;
  videoTexture.magFilter = THREE.NearestFilter;
  videoTexture.format = THREE.RGBFormat;

  videoTexture2 = new THREE.VideoTexture(video2);
  videoTexture2.minFilter = THREE.NearestFilter;
  videoTexture2.magFilter = THREE.NearestFilter;
  videoTexture2.format = THREE.RGBFormat;

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100000);
  camera.position.z = 50;
  scene = new THREE.Scene();

  audioClips = document.getElementsByClassName("audioClip");

  // var planeGeometry = new THREE.PlaneGeometry(2, 2);
  // // var mat = new THREE.MeshBasicMaterial({map:videoTexture});
  // // var mat = new THREE.MeshBasicMaterial({color: new THREE.Color("pink")});
  // material = makeBarMaterial();
  // var mesh = new THREE.Mesh(planeGeometry, material);
  // scene.add(mesh);

  size = renderer.getSize();
  var dpr = renderer.getPixelRatio();
  for (var i = 0; i < audioClips.length; i++) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    var hue = Math.random() * 255;
    var mat = makeBarMaterial({
      color: new THREE.Color("hsl("+hue+", 70%, 50%)"),
      video: videoTexture,
      resolution: new THREE.Vector2(size.width * dpr, size.height * dpr),
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = THREE.Math.mapLinear(i, 0, audioClips.length, -0.5, 0.5);
    mesh.position.x += 0.5/audioClips.length;
    scene.add(mesh);
    materials.push(mat);
  }
}

function addPlayCounter() {
  playCounter++;
  console.log(playCounter);
  if (playCounter == audioClips.length + 2) {
    for (var i = 0; i < audioClips.length; i++) {
      audioClips[i].play();
      video.play();
      video2.play();
    }
  }
}

// This doesn't acutally work
function sync(time) {
  playHead = (time !== undefined) ? time : audioClips[0].currentTime;
  playCounter = 0;
  for (var i = 0; i < audioClips.length; i++) {
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
  requestAnimationFrame( animate );
  render();
}

document.addEventListener("click", onDocumentClick, false );
document.addEventListener("mousemove", onDocumentMouseMove, false );
// var projector = new THREE.Projector();
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

  materials[hoverOver].uniforms.u_playing.value = !materials[hoverOver].uniforms.u_playing.value;
  if (materials[hoverOver].uniforms.u_playing.value === true) {
    materials[hoverOver].uniforms.u_videoTexture.value = videoTexture;
  } else {
    materials[hoverOver].uniforms.u_videoTexture.value = videoTexture2;
  }
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  size = renderer.getSize();
  mousePosition.x = event.clientX / size.width;
  mousePosition.y = 1 - event.clientY / size.height;

  var hoverOver = Math.floor(mousePosition.x * audioClips.length);

  for (var i = 0; i < materials.length; i++) {
    materials[i].uniforms.u_mousePos.value = mousePosition;
    materials[i].uniforms.u_mouseOver.value = false;
    if (i == hoverOver) {
      materials[i].uniforms.u_mouseOver.value = true;
    }
  }
}

init();
animate();
