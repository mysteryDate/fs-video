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
var audioClips = document.getElementsByClassName("audioClip");
var videoClips = document.getElementsByClassName("videoClip");
var videoTextures = [];
var playHead = 0;
var controls;
var size;
var mousePosition = new THREE.Vector2();
var barMaterials = [];

function makeBarMaterial(options) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_color: {value: options.color || new THREE.Color("pink")},
      u_mousePos: {value: new THREE.Vector2(0, 0)},
      u_mouseOver: {value: false},
      u_playing: {value: true},
      u_videoTexture: {value: options.video},
      u_resolution: {value: options.resolution || new THREE.Vector2(1, 1)},
      u_isColor: {value: true},
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
      uniform bool u_isColor;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec3 tex = texture2D(u_videoTexture, uv).rgb;

        vec3 col = vec3(0.0);
        if (u_mouseOver == true) {
          col += vec3(0.5);
        }
        if (u_isColor == false) {
          tex = vec3(length(tex)/3.0);
        }
        gl_FragColor = vec4(col + tex, 1.0);
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

  for (var i = 0; i < videoClips.length; i++) {
    var vt = new THREE.VideoTexture(videoClips[i]);
    vt.minFilter = vt.magFilter = THREE.NearestFilter;
    vt.format = THREE.RGBFormat;
    videoTextures.push(vt);
  }

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100000);
  camera.position.z = 50;
  scene = new THREE.Scene();

  size = renderer.getSize();
  var dpr = renderer.getPixelRatio();
  for (var i = 0; i < audioClips.length; i++) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    var hue = Math.random() * 255;
    var mat = makeBarMaterial({
      color: new THREE.Color("hsl("+hue+", 70%, 50%)"),
      video: videoTextures[0],
      resolution: new THREE.Vector2(size.width * dpr, size.height * dpr),
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = THREE.Math.mapLinear(i, 0, audioClips.length, -0.5, 0.5);
    mesh.position.x += 0.5/audioClips.length;
    scene.add(mesh);
    barMaterials.push(mat);
  }
}

function addPlayCounter() {
  playCounter++;
  console.log(playCounter);
  if (playCounter == audioClips.length + videoClips.length) {
    for (var i = 0; i < audioClips.length; i++) {
      audioClips[i].play();
    }
    for (var i = 0; i < videoClips.length; i++) {
      videoClips[i].play();
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
    barMaterials[i].uniforms.u_mousePos.value = mousePosition;
    barMaterials[i].uniforms.u_mouseOver.value = false;
    if (i == hoverOver) {
      barMaterials[i].uniforms.u_mouseOver.value = true;
    }
  }
}

init();
animate();
