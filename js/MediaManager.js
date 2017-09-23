"use strict";
var Clip = function(element) {
  this.element = element;
  this.name = element.id;
  this.canPlay = false;
  this.playing = false;
  this.started = false;

  function start() {
    this.element.play();
    this.playing = true;
    this.started = true;
  }

  function pause() {
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
        state = "playing";
      });
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
          c.play();
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

  return {
    clips: clips,
    start: start,
    pause: pause,
    unpause: unpause,
  }
});