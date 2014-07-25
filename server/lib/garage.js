var Gpio = require('onoff').Gpio;
var events = require('events');
var logger = require('morgan');
var config = require('./config');
var _ = require('underscore');

var controller = new events.EventEmitter();

var doorStatus = new Gpio(config('gpio:status_pin') || 4, 'in', 'both');
var doorToggle = new Gpio(config('gpio:toggle_pin') || 25, 'out');

// time in seconds for door to move
var DOOR_DELAY = config('garage:move_time') || 12;

// State of door
var state = {
    serial: (new Date()).valueOf(),
    door:'unknown',
    timestamp: new Date()
};

var setState = function(val) {
    if (val === state.door) return;
    var tmp = {};
    tmp.serial = new Date().valueOf();
    tmp.door = val;
    tmp.timestamp = new Date();
    controller.emit('changed', tmp);
    state = tmp;
};

doorStatus.watch(function(err, value) {
  if (state.door !== 'moving') {
    setState(value ? 'closed': 'open');
  }
});

var updateState = function() {
  doorStatus.read(function(err, value) {
    setState(value ? 'closed': 'open');
  });
};
updateState();

controller.open = function() {
    if (state.door === 'closed') {
        setState('moving');
        doorToggle.writeSync(1);
        setTimeout(function() {doorToggle.writeSync(0);}, 500);
        setTimeout(function () {updateState(); }, DOOR_DELAY * 1000);
    }
};

controller.close = function() {
    if (state.door === 'open') {
        setState('moving');
        doorToggle.writeSync(1);
        setTimeout(function() {doorToggle.writeSync(0);}, 500);
        setTimeout(function () {updateState(); }, DOOR_DELAY * 1000);
    }
};

controller.state = function() {
  var tmp = {};
  _.extend(tmp, state);
   return tmp;
};

module.exports = controller;
