"use strict";

var container;
var renderer;
var video;
var videoTexture;
var camera;
var scene;

var playCounter = 0;
var audioClips;
var playHead = 0;
var controls;

function init() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer( { antialias: false } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  video = document.getElementById( 'base-video' );

  // videoTexture = new THREE.VideoTexture( video );
  // videoTexture.minFilter = THREE.NearestFilter;
  // videoTexture.magFilter = THREE.NearestFilter;
  // videoTexture.format = THREE.RGBFormat;

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100000);
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  camera.position.z = 50;
  scene = new THREE.Scene();
  // var planeGeometry = new THREE.PlaneGeometry(2, 2);
  // var mat = new THREE.MeshBasicMaterial({map:videoTexture});
  // var mat = new THREE.MeshBasicMaterial({color: new THREE.Color("pink")});
  // var mesh = new THREE.Mesh(planeGeometry, mat);
  // scene.add(mesh);

  audioClips = document.getElementsByClassName("audioClip");

  for (var i = 0; i < audioClips.length; i++) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    var mat = new THREE.MeshBasicMaterial({color:new THREE.Color(Math.random(), Math.random(), Math.random())});
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = THREE.Math.mapLinear(i, 0, audioClips.length, -0.5, 0.5);
    mesh.position.x += 0.5/audioClips.length;
    console.log(mesh.position.x);
    scene.add(mesh);
  }
}

function addPlayCounter() {
  playCounter++;
  if (playCounter == audioClips.length) {
    for (var i = 0; i < audioClips.length; i++) {
      audioClips[i].play();
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
  controls.update();
  render();
}

function videoCanPlay() {
  console.log("play");
}

init();
animate();
