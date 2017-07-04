// (function() {
  "use strict";

  var container;
  var renderer;
  var video;
  var videoTexture;
  var camera;
  var scene;

  function init() {
    container = document.getElementById("container");
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    video = document.getElementById( 'base-video' );

    videoTexture = new THREE.VideoTexture( video );
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.format = THREE.RGBFormat;

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.z = 50;
    scene = new THREE.Scene();
    var planeGeometry = new THREE.PlaneGeometry(2, 2);
    var mat = new THREE.MeshBasicMaterial({map:videoTexture});
    var mesh = new THREE.Mesh(planeGeometry, mat);
    scene.add(mesh);

  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame( animate );
    render();
  }

  // init();
  // animate();
// })();
