"use strict";

// THREE.js stuff
var container;
var renderer;
var camera;
var scene;
var raycaster = new THREE.Raycaster();

// Materials and textures
var videoTextures = [];
var barScreen;

var i;
var lyricsTextField = document.getElementById("lyricsText");
var lyricsJSON;
var lyricsIndex = 0;

var LOADING_SCREEN;
var FADE_IN_TIME = 3;
var LYRICS_ON = false;
var ASPECT_RATIO = 1920/1080;

// Counters and UI
var MM = new MediaManager(document.getElementsByClassName("media"));

function toggleLyrics(event, setting) {
  if (event !== undefined) {
    event.stopPropagation();
  }
  if (setting !== undefined) {
    LYRICS_ON = setting;
  } else {
    LYRICS_ON = !LYRICS_ON;
  }
}

function timeStringToInt(time) {
  var minutes = parseInt(time.split(":")[0], 10);
  var seconds = parseInt(time.split(":")[1], 10);
  return minutes * 60 + seconds;
}

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "lyrics_block.json", true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState === 4 && xobj.status === 200) {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function setBarUniform(name, value) {
  for (i = 0; i < barScreen.children.length; i++) {
    barScreen.children[i].material.uniforms[name].value = value;
  }
}

function sizeAndPositionBars() {
  var size = renderer.getSize();
  var width = Math.min(size.width, size.height * ASPECT_RATIO);
  var height = Math.min(size.height, size.width / ASPECT_RATIO);

  var percentageWidth = width / size.width;
  var percentageHeight = height / size.height;

  barScreen.children.forEach(function(mesh, index) {
    mesh.scale.x = percentageWidth;
    mesh.scale.y = percentageHeight;
    mesh.position.x = THREE.Math.mapLinear(index, 0, barScreen.children.length, -percentageWidth/2, percentageWidth/2);
  });
}


function setLyrics() {
  var isChuckOn;
  for (i = 0; i < barScreen.children.length; i++) {
    if (barScreen.children[i].name === "chuck") {
      isChuckOn = barScreen.children[i].material.uniforms.u_playing.value;
    }
  }
  if (lyricsJSON !== undefined) {
    var t = MM.getCurrentAudioTime();
    var currentLyric = lyricsJSON[lyricsIndex];
    var nextLyric = lyricsJSON[lyricsIndex + 1];
    var nextStart = (nextLyric !== undefined) ? timeStringToInt(nextLyric.startTime) : Infinity;
    var thisStart = timeStringToInt(currentLyric.startTime);
    var thisEnd = timeStringToInt(currentLyric.endTime);
    if (t >= nextStart) {
      lyricsIndex++;
      lyricsTextField.textContent = nextLyric.lyrics[0];
    } else if (t >= thisEnd) {
      lyricsTextField.textContent = "";
    } else {
      var lyricsLength = currentLyric.lyrics.length;
      var normalizedPosition = (t - thisStart) / (thisEnd - thisStart);
      lyricsTextField.textContent = currentLyric.lyrics[Math.floor(normalizedPosition * lyricsLength)];
    }
    if (lyricsTextField.textContent === "" || LYRICS_ON === false || isChuckOn === false) {
      lyricsTextField.style.display = "none";
    } else {
      lyricsTextField.style.display = "inline-block";
    }
  } else {
    lyricsTextField.style.display = "none";
  }
}

function onDocumentClick(event) {
  event.preventDefault();

  var ac = MM.getAudioClips();
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersectedBars = raycaster.intersectObjects(barScreen.children);
  for (i = 0; i < intersectedBars.length; i++) {
    var isPlaying = intersectedBars[i].object.material.uniforms.u_playing;
    var videoTexture = intersectedBars[i].object.material.uniforms.u_videoTexture;
    isPlaying.value = !isPlaying.value;
    if (isPlaying.value === true) {
      videoTexture.value = videoTextures[0];
    } else {
      videoTexture.value = videoTextures[1];
    }
  }

  for (i = 0; i < ac.length; i++) {
    if (barScreen.children[i].material.uniforms.u_playing.value) {
      ac[i].element.volume = 1;
    } else {
      ac[i].element.volume = 0;
    }
  }
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  for (i = 0; i < barScreen.children.length; i++) {
    barScreen.children[i].material.uniforms.u_mouseOver.value = false;
    barScreen.children[i].material.uniforms.u_mouse.value.x = (mouse.x + 1) / 2;
    barScreen.children[i].material.uniforms.u_mouse.value.y = (mouse.y + 1) / 2;
  }
  var intersectedBars = raycaster.intersectObjects(barScreen.children);
  for (i = 0; i < intersectedBars.length; i++) {
    intersectedBars[i].object.material.uniforms.u_mouseOver.value = true;
  }

  if (MM.getState() === "not started") {
    LOADING_SCREEN.material.uniforms.u_mouse.value.x = (mouse.x + 1) / 2;
    LOADING_SCREEN.material.uniforms.u_mouse.value.y = (mouse.y + 1) / 2;
  }
}

window.onresize = function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  sizeAndPositionBars();
};

document.addEventListener("click", onDocumentClick, false);
document.addEventListener("mousemove", onDocumentMouseMove, false);

function init() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var videoClips = MM.getVideoClips();
  videoClips.forEach(function(vc) {
    var vt = new THREE.VideoTexture(vc.element);
    vt.minFilter = vt.magFilter = THREE.NearestFilter;
    vt.format = THREE.RGBFormat;
    videoTextures.push(vt);
  });

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100);
  camera.position.set(0.5, 0.5, 50);
  scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  var audioClips = MM.getAudioClips();
  barScreen = new THREE.Group();
  for (i = 0; i < audioClips.length; i++) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    geo.translate(0.5/audioClips.length, 0, 0); // so that the mesh is centered in x
    var mat = Materials.bar({
      video: videoTextures[0],
      index: i,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.name = audioClips[i].name;
    barScreen.add(mesh);
  }
  barScreen.position.set(0.5, 0.5, 0);
  scene.add(barScreen);
  sizeAndPositionBars();

  var loadingScreenSize = 0.8;
  LOADING_SCREEN = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(loadingScreenSize * window.innerHeight / window.innerWidth, loadingScreenSize),
    Materials.loadingIcon());
  LOADING_SCREEN.position.set(0.5, 0.5, -1);
  scene.add(LOADING_SCREEN);

  loadJSON(function(response) {
    lyricsJSON = JSON.parse(response);
  });
  toggleLyrics(undefined, false);

  function update() {
    MM.update();
    if (MM.getState() === "not started") {
      LOADING_SCREEN.material.uniforms.u_time.value = performance.now()/1000;
    } else {
      var videoT = MM.getCurrentVideoTime();
      for (i = 0; i < barScreen.children.length; i++) {
        LOADING_SCREEN.material.uniforms.u_opacity.value = 2 - videoT/FADE_IN_TIME;
        barScreen.children[i].material.uniforms.u_opacity.value = videoT/FADE_IN_TIME;
        barScreen.children[i].material.uniforms.u_clock.value = performance.now()/1000;
      }
    }

    requestAnimationFrame(update);
    renderer.render(scene, camera);
    setLyrics();
  }
  update();
}

init();
