// (function() {
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

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.z = 50;
    scene = new THREE.Scene();
    var planeGeometry = new THREE.PlaneGeometry(2, 2);
    // var mat = new THREE.MeshBasicMaterial({map:videoTexture});
    var mat = new THREE.MeshBasicMaterial({color: new THREE.Color("pink")});
    var mesh = new THREE.Mesh(planeGeometry, mat);
    scene.add(mesh);

    audioClips = document.getElementsByClassName("audioClip");
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
    render();
  }

  function videoCanPlay() {
    console.log("play");
  }

  init();
  animate();
// })();
