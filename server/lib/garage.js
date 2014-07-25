var gpio = require('pi-gpio');
var events = require('events');
var logger = require('morgan');

var controller = new events.EventEmitter();

// IO pin used for testing door status.  S/B high for door open.
var DOOR_STATUS_PIN = nconf.get('gpio:status_pin') || 4;

// IO pin used to toggle garage opener
var DOOR_TOGGLE_PIN = nconf.get('gpio:toggle_pin') || 25;

// time in seconds for door to move
var DOOR_DELAY = nconf.get('garage:move_time') || 12;

// State of door
var state = {
    door:'unknown',
    timestamp: null
};

var setState = function(val) {
    var tmp = {};
    tmp.door = val;
    tmp.timestamp = new Date();
    state = tmp;
};

var updateState = function() {
    gpio.read(DOOR_STATUS_PIN, function(err, val) {
        if (!err) {
            setState(val === 1? 'open': 'closed');
        }
    });
};

gpio.open(DOOR_STATUS_PIN, 'input pull-up', function(err) {
    if (err) {
        logger.format("Unable to open status pin: %s", err);
    } else {
        updateState();
    }
});

gpio.open(DOOR_TOGGLE_PIN, 'output', function(err) {
    if (err) {
        logger.format("Unable to open toggle pin: %s", err);
    }
});


controller.open = function() {
    if (state.door === 'closed') {
        setState('moving');
        gpio.write(DOOR_TOGGLE_PIN, 1, function(err) {
            setTimeout(function () { gpio.write(DOOR_TOGGLE_PIN, 0); }, 500);
            setTimeout(function () { updateState(); }, DOOR_DELAY * 1000);
        });
    }
};

controller.close = function() {

};

controller.state = function() {
   return state;
};

module.exports = controller;
