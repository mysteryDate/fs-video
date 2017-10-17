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
var NUM_ACTION_CLIPS = 6;

// Counters and UI
var MM;
var CC_BUTTON;
var URL_OPTIONS = {
  displayMode: 1,
  resolution: "high",
};

function toggleLyrics(event, setting) {
  if (event !== undefined) {
    event.stopPropagation();
  }
  if (setting !== undefined) {
    LYRICS_ON = setting;
  } else {
    LYRICS_ON = !LYRICS_ON;
  }

  if (LYRICS_ON) {
    CC_BUTTON.style.backgroundImage = "url(img/cc-button-on.jpg)";
  } else {
    CC_BUTTON.style.backgroundImage = "url(img/cc-button.jpg)";
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
function reload() {
  window.location.reload(false);
}

function onDocumentClick(event) {
  if (MM.getState() === "not started" && MM.ready()) {
    MM.start();
    return;
  }
  if (MM.getState() === "ended") {
    reload();
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

function parseOptionString() {
  var url = window.location.href;
  var optionString = url.split("#")[1] || "";
  var options = optionString.split("&");
  Object.keys(URL_OPTIONS).forEach(function(urlOption) {
    for (i = 0; i < options.length; i++) {
      var key = options[i].split("=")[0];
      var value = options[i].split("=")[1];
      if (urlOption === key) {
        URL_OPTIONS[urlOption] = value;
      }
    }
  });
}

function init() {
  parseOptionString();
  var medias = document.getElementsByClassName("media");
  for (i = 0; i < medias.length; i++) {
    var kind = medias[i].tagName.toLowerCase();
    var extension = ".mp3";
    var type = "audio/mpeg";
    var folder = "audio/compressed";
    var name = medias[i].id;
    if (kind === "video") {
      folder = "videos";
      extension = ".mp4";
      type = "video/mp4";
      if (name === "action") {
        var index = Math.ceil(Math.random() * NUM_ACTION_CLIPS);
        name = name + "-" + index;
      }
    }
    var fileName = folder+"/"+name+extension;
    if (URL_OPTIONS.resolution === "low") {
      fileName = folder+"/small/"+name+extension;
    }
    var source = document.createElement("source");
    source.src = fileName;
    source.type = type;
    medias[i].appendChild(source);
  }

  var resButton = document.getElementById("res-button");
  resButton.style.backgroundImage = "url(img/lo-res.jpg)";
  var resLine = document.getElementById("resLine");
  resLine.textContent = "Watching from a low speed connection? ";
  var resLink = document.createElement("a");
  resLink.textContent = "Try the 8-bit style low res option.";
  resLink.href = "#resolution=low";
  if (URL_OPTIONS.resolution === "low") {
    resButton.style.backgroundImage = "url(img/hi-res.jpg)";
    resButton.href = "#resolution=high";
    resLine.textContent = "";
    resLink.textContent = "Try the hi res option";
    resLink.href = "";
  }
  resLine.appendChild(resLink);
  resLink.onclick = reload;

  MM = new MediaManager(medias);
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
  barScreen.visible = false;

  LOADING_SCREEN = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 1),
    Materials.loadingIcon()
  );
  var loadingScreenScale = new THREE.Vector3(loadingScreenSize * window.innerHeight / window.innerWidth, loadingScreenSize, 1);
  LOADING_SCREEN.scale.copy(loadingScreenScale);
  LOADING_SCREEN.position.set(0.5, loadingScreenScale.y/2 + 0.1, -1);
  scene.add(LOADING_SCREEN);

  CC_BUTTON = document.getElementById("cc-button");
  loadJSON(function(response) {
    lyricsJSON = JSON.parse(response);
  });
  toggleLyrics(undefined, false);

  setBarUniform("u_displayMode", URL_OPTIONS.displayMode);

  function update() {
    MM.update();
    var videoT = MM.getCurrentVideoTime();
    var tutorial;
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
      var closingCredits = document.getElementById("closingCredits");
      if (endTime === undefined) {
        closingCredits.style.display = "block";
        endTime = performance.now()/1000;
      }
      var t = (performance.now()/1000 - endTime)/FADE_IN_TIME;
      setBarUniform("u_opacity", 1 - t);
      closingCredits.style.opacity = t - 1;
    } else if (videoT < 2 * FADE_IN_TIME) {
      if (barScreen.visible === false) {
        barScreen.visible = true;
        var buttons = document.getElementsByClassName("button");
        for (i = 0; i < buttons.length; i++) {
          buttons[i].style.display = "block";
        }
      }
      tutorial = document.getElementById("tutorial");
      LOADING_SCREEN.material.uniforms.u_opacity.value = 2 - videoT/FADE_IN_TIME;
      loadingText.style.opacity = 1 - 2 * videoT/FADE_IN_TIME;
      tutorial.style.opacity = 1 - 2 * videoT/FADE_IN_TIME;
      setBarUniform("u_opacity", videoT/FADE_IN_TIME);
    } else if (LOADING_SCREEN.visible === true) {
      LOADING_SCREEN.visible = false;
      tutorial = document.getElementById("tutorial");
      tutorial.parentElement.removeChild(tutorial);
    }
    requestAnimationFrame(update);
    renderer.render(scene, camera);
    setLyrics();
  }
  console.log(bowser);
  update();
}

init();
