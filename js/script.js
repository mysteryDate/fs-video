"use strict";

// var AUDIO_DELAY = 3600; // ms between start of video and audio
var AUDIO_DELAY = 0; // ms between start of video and audio
var PAUSED = false;

// THREE.js stuff
var container;
var renderer;
var camera;
var scene;

// Materials and textures
var videoTextures = [];
var barMaterials = [];

var i;
var lyricsTextField = document.getElementById("lyricsText");
var lyricsJSON;
var lyricsIndex = 0;

var LOADING_SCREEN;
var videoStartTime;
var PLAYING = false;
var FADE_IN_TIME = 3000;
var LYRICS_ON = false;

// Counters and UI
var playHead = 0;
var size;
var mousePosition = new THREE.Vector2();

var mediaManager = new MediaManager(document.getElementsByClassName("media"));

function timeStringToInt(time) {
  var minutes = parseInt(time.split(":")[0], 10);
  var seconds = parseInt(time.split(":")[1], 10);
  return minutes * 60 + seconds;
}

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'lyrics_block.json', true);
  xobj.onreadystatechange = function () {
    console.log(xobj.readyState, xobj.status);
    if (xobj.readyState === 4 && xobj.status === 200) {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function init() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var videoClips = mediaManager.getVideoClips();
  videoClips.forEach(function(vc) {
    var vt = new THREE.VideoTexture(vc.element);
    vt.minFilter = vt.magFilter = THREE.NearestFilter;
    vt.format = THREE.RGBFormat;
    videoTextures.push(vt);
  });

  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100);
  camera.position.set(0.5, 0.5, 50);
  scene = new THREE.Scene();

  size = renderer.getSize();
  var dpr = renderer.getPixelRatio();
  var audioClips = mediaManager.getAudioClips();
  audioClips.forEach(function(ac) {
    var geo = new THREE.PlaneGeometry(1/audioClips.length, 1);
    var mat = Materials.bar({
      video: videoTextures[0],
      resolution: new THREE.Vector2(size.width * dpr, size.height * dpr),
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = THREE.Math.mapLinear(i, 0, audioClips.length, 0, 1);
    mesh.position.x += 0.5/audioClips.length;
    mesh.position.y = 0.5;
    scene.add(mesh);
    barMaterials.push(mat);
  });

  var loadingScreenSize = 0.8;
  LOADING_SCREEN = new THREE.Mesh(new THREE.PlaneBufferGeometry(loadingScreenSize * window.innerHeight / window.innerWidth, loadingScreenSize), Materials.loadingIcon());
  LOADING_SCREEN.position.set(0.5, 0.5, 0);
  scene.add(LOADING_SCREEN);

  loadJSON(function(response) {
  // Parse JSON string into object
    lyricsJSON = JSON.parse(response);
  });
}

function setLyrics() {
  if (lyricsJSON !== undefined) {
    var t = mediaManager.getCurrentAudioTime();
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
    if (lyricsTextField.textContent === "" || LYRICS_ON === false) {
      lyricsTextField.style.display = "none";
    } else {
      lyricsTextField.style.display = "inline-block";
    }
  } else {
    lyricsTextField.style.display = "none";
  }
}

function update() {
  if (mediaManager.state === "playing") {
    var videoT = performance.now() - videoStartTime;
    for (i = 0; i < barMaterials.length; i++) {
      barMaterials[i].uniforms.u_opacity.value = videoT/FADE_IN_TIME;
    }
  }
  else {
    LOADING_SCREEN.material.uniforms.u_time.value = performance.now()/1000;
  }
  requestAnimationFrame(update);
  renderer.render(scene, camera);
  setLyrics();
}

function onDocumentClick(event) {
  event.preventDefault();

  size = renderer.getSize();
  mousePosition.x = event.clientX / size.width;
  mousePosition.y = 1 - event.clientY / size.height;
  // var hoverOver = Math.floor(mousePosition.x * audioClips.length);

  // if (audioClips[hoverOver].volume === 1) {
  //   audioClips[hoverOver].volume = 0;
  // } else {
  //   audioClips[hoverOver].volume = 1;
  // }
  //
  // barMaterials[hoverOver].uniforms.u_playing.value = !barMaterials[hoverOver].uniforms.u_playing.value;
  // if (barMaterials[hoverOver].uniforms.u_playing.value === true) {
  //   barMaterials[hoverOver].uniforms.u_videoTexture.value = videoTextures[0];
  // } else {
  //   barMaterials[hoverOver].uniforms.u_videoTexture.value = videoTextures[1];
  // }

  if (!PLAYING) {
    var state = LOADING_SCREEN.material.uniforms.u_state.value;
    state = (state + 1) % 3;
    LOADING_SCREEN.material.uniforms.u_state.value = state;
  }
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  size = renderer.getSize();
  mousePosition.x = event.clientX / size.width;
  mousePosition.y = 1 - event.clientY / size.height;

  // var hoverOver = Math.floor(mousePosition.x * audioClips.length);
  //
  // for (i = 0; i < barMaterials.length; i++) {
  //   barMaterials[i].uniforms.u_mouseOver.value = false;
  //   if (i === hoverOver) {
  //     barMaterials[i].uniforms.u_mouseOver.value = true;
  //   }
  // }

  if (!PLAYING) {
    LOADING_SCREEN.material.uniforms.u_mouse.value.x = mousePosition.x;
    LOADING_SCREEN.material.uniforms.u_mouse.value.y = mousePosition.y;
  }
}

function toggleLyrics(event) {
  event.stopPropagation();
  LYRICS_ON = !LYRICS_ON;
}

document.addEventListener("click", onDocumentClick, false);
document.addEventListener("mousemove", onDocumentMouseMove, false);

init();
update();
