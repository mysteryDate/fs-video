"use strict";
var Clip = function(element) {
  this.element = element;
  this.name = element.id;
  this.canPlay = false;
  this.playing = false;
  this.started = false;
  this.type = element.classList[1];

   this.start = function() {
    this.element.play();
    this.playing = true;
    this.started = true;
  }

   this.pause = function() {
    this.element.pause();
    this.playing = false;
  }
}

var MediaManager = (function(clipElements) {
  var clips = [];
  var state = "not started";

  for (var i = 0; i < clipElements.length; i++) {
    clips.push(new Clip(clipElements[i]));
  }

  function canPlay() {
    var result = true;
    clips.forEach(function(c) {
      if(c.canPlay === false) {
        result = false;
      }
    });
    return result;
  }

  function start() {
    if (canPlay() && state === "not started") {
      clips.forEach(function(c) {
        if (c.started) {
          console.warn("You're asking clip " + c.name + " to start though it already has");
        }
        c.start();
      });
      state = "playing";
    } else if (state !== "not started") {
      console.warn("Can't start, already started. State: " + state);
    } else {
      console.warn("Can't start, not ready");
    }
  }

  function pause() {
    if (state === "playing") {
      clips.forEach(function(c) {
        var changeState = true;
        if (c.started && c.playing) {
          c.pause();
        } else {
          changeState = false;
          console.warn(c.name + " cannot be paused. Playing: " + c.playing + " Started: " + c.started);
        }
        if (changeState) {
          state = "paused";
        }
      });
    } else {
      console.warn("Can't pause, not playing. State: " + state);
    }
  }

  function unpause() {
    if (state === "paused") {
      clips.forEach(function(c) {
        var changeState = true;
        if (c.started && !c.playing) {
          c.start();
        } else {
          changeState = false;
          console.warn(c.name + " cannot be unpaused. Playing: " + c.playing + " Started: " + c.started);
        }
        if (changeState) {
          state = "playing";
        }
      });
    } else {
      console.warn("Can't unpause, not paused. State: " + state);
    }
  }

  function getClip(name) {
    var result;
    clips.forEach(function(c) {
      if (c.name === name) {
        result = c;
      }
    });
    if (result === undefined) {
      console.warn("No clip named " + name + " exists");
    }
    return result;
  }

  function readyClip(event) {
    var name = event.target.id;
    var c = getClip(name);
    c.canPlay = true;
  }

  function isWaiting(event) {
    var name = event.target.id;
    var c = getClip(name);
    c.canPlay = false;

    if (state === "playing") {
      pause();
    }
  }

  function getVideoClips() {
    var result = [];
    clips.forEach(function(c) {
      if (c.type === "video") {
        result.push(c);
      }
    });
    return result;
  }

  function getAudioClips() {
    var result = [];
    clips.forEach(function(c) {
      if (c.type === "audio") {
        result.push(c);
      }
    });
    return result;
  }

  function getCurrentVideoTime() {
    var vc = getVideoClips();
    return vc[0].element.currentTime;
  }

  function getCurrentAudioTime() {
    var ac = getAudioClips();
    return ac[0].element.currentTime;
  }

  function setVolume(volume) {
    var ac = getAudioClips();
    ac.forEach(function(c) {
      c.element.volume = volume;
    });
  }

  function update() {
    if (state === "not started" && canPlay()) {
      start();
    } else if (state === "paused" && canPlay()) {
      unpause();
    }
  }

  function getState() {
    return state;
  }

  return {
    clips: clips,
    start: start,
    pause: pause,
    unpause: unpause,
    getClip: getClip,
    readyClip: readyClip,
    isWaiting: isWaiting,
    getVideoClips: getVideoClips,
    getAudioClips: getAudioClips,
    getCurrentVideoTime: getCurrentVideoTime,
    getCurrentAudioTime: getCurrentAudioTime,
    update: update,
    setVolume: setVolume,
    getState: getState,
  }
});
