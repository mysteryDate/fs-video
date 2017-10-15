/* global bowser */

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
var loadingText = document.getElementById("loadingText");
var loadingScreenSize = 0.3;
var FADE_IN_TIME = 3;
var LYRICS_ON = false;
var ASPECT_RATIO = 1920/1080;
var endTime;
var readyTime;

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

  var ccButton = document.getElementById("cc-button");
  if (LYRICS_ON) {
    ccButton.style.backgroundImage = "url(img/cc-button-on.jpg)";
  } else {
    ccButton.style.backgroundImage = "url(img/cc-button.jpg)";
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
  xobj.open("GET", "lyrics.json", true);
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

  setBarUniform("u_verticalSize", percentageHeight);
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
  if (MM.getState() === "not started" && MM.ready()) {
    MM.start();
    return;
  }
  if (MM.getState() === "ended") {
    window.location.reload(false);
  }

  var ac = MM.getAudioClips();
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersectedBars = raycaster.intersectObjects(barScreen.children);
  for (i = 0; i < intersectedBars.length; i++) {
    intersectedBars[i].object.material.uniforms.u_playing.value = !intersectedBars[i].object.material.uniforms.u_playing.value;
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
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersectedBars = raycaster.intersectObjects(barScreen.children);
  var intersectedIndex = -1;
  for (i = 0; i < barScreen.children.length; i++) {
    barScreen.children[i].material.uniforms.u_mouseOver.value = false;
    barScreen.children[i].material.uniforms.u_mouse.value.x = (mouse.x + 1) / 2;
    barScreen.children[i].material.uniforms.u_mouse.value.y = (mouse.y + 1) / 2;
    if (intersectedBars.length > 0 && intersectedBars[0].object === barScreen.children[i]) {
      intersectedIndex = i;
    }
  }
  for (i = 0; i < intersectedBars.length; i++) {
    intersectedBars[i].object.material.uniforms.u_mouseOver.value = true;
  }
  setBarUniform("u_intersectedIndex", intersectedIndex);

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
      video2: videoTextures[1],
      index: i,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.name = audioClips[i].name;
    barScreen.add(mesh);
  }
  barScreen.position.set(0.5, 0.5, 0);
  scene.add(barScreen);
  sizeAndPositionBars();

  LOADING_SCREEN = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 1),
    Materials.loadingIcon()
  );
  var loadingScreenScale = new THREE.Vector3(loadingScreenSize * window.innerHeight / window.innerWidth, loadingScreenSize, 1);
  LOADING_SCREEN.scale.copy(loadingScreenScale);
  LOADING_SCREEN.position.set(0.5, loadingScreenScale.y/2 + 0.1, -1);
  scene.add(LOADING_SCREEN);

  loadJSON(function(response) {
    lyricsJSON = JSON.parse(response);
  });
  toggleLyrics(undefined, false);

  var url = window.location.href;
  var displayMode = url.split("dm=")[1];
  setBarUniform("u_displayMode", displayMode);

  function update() {
    MM.update();
    if (MM.getState() === "not started" && !MM.ready()) {
      LOADING_SCREEN.material.uniforms.u_time.value = performance.now()/1000;
      loadingText.style.opacity = Math.sin(2 * performance.now()/1000)/2 + 0.5;
    } else if (MM.getState() === "not started" && MM.ready()) {
      if (readyTime === undefined) {
        readyTime = performance.now()/1000;
      }
      var shapeT = performance.now()/1000 - readyTime;
      LOADING_SCREEN.material.uniforms.u_maskShape.value = THREE.Math.smoothstep(shapeT/FADE_IN_TIME * 2, 0, 1);
      loadingText.style.opacity = 1;
      loadingText.textContent = "CLICK TO PLAY";
    } else if (MM.getState() === "ended") {
      var openingCredits = document.getElementById("openingCredits");
      var closingCredits = document.getElementById("closingCredits");
      if (endTime === undefined) {
        openingCredits.style.display = "block";
        closingCredits.style.display = "block";
        endTime = performance.now()/1000;
      }
      var t = (performance.now()/1000 - endTime)/FADE_IN_TIME;
      setBarUniform("u_opacity", 1 - t);
      var openingOpacity = THREE.Math.smoothstep(t, 0, 1) * THREE.Math.smoothstep(2 - t, 0, 1);
      openingCredits.style.opacity = openingOpacity;
      closingCredits.style.opacity = t - 2;
    } else {
      var videoT = MM.getCurrentVideoTime();
      var tutorial = document.getElementById("tutorial");
      var ccButton = document.getElementById("cc-button");
      ccButton.style.display = "block";
      LOADING_SCREEN.material.uniforms.u_opacity.value = 2 - videoT/FADE_IN_TIME;
      loadingText.style.opacity = 1 - 2 * videoT/FADE_IN_TIME;
      tutorial.style.opacity = 1 - 2 * videoT/FADE_IN_TIME;
      for (i = 0; i < barScreen.children.length; i++) {
        barScreen.children[i].material.uniforms.u_opacity.value = videoT/FADE_IN_TIME;
        barScreen.children[i].material.uniforms.u_clock.value = performance.now()/1000;
      }
    }
    requestAnimationFrame(update);
    renderer.render(scene, camera);
    setLyrics();
  }
  console.log(bowser);
  update();
}

init();
