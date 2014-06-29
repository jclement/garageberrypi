var gpio = require('gpio');
var events = require('events');
var _ = require('underscore');

var DOOR_STATUS_PIN = 4;
var DOOR_TOGGLE_PIN = 25;
var DOOR_DELAY = 12; // time in seconds for door to move

var current = {
    state: null,
    stateTime: null
};

var controller = new events.EventEmitter();

var statusPin = gpio.export(DOOR_STATUS_PIN, {
    direction: 'in',
    ready: function() {
        updateState(readState());
    }
});

var controlPin = gpio.export(DOOR_TOGGLE_PIN, {
    direction: 'out',
    ready: function() {
    }
});

var readState = function() {
    return statusPin.value === 1?"open":"closed";
};

var buildPublicState = function() {
    return {
        status: current.state,
        duration: new Date() - current.stateTime
    };
}

var updateState = function(state) {
    if (current.state !== state) {
        current = {
            state: state,
            stateTime: new Date()
        };
        controller.emit('change', buildPublicState(current));
    }
}

statusPin.on("change", function(val) {
    var state = val === 1? "open":"closed";
    console.log('State Change > ' + state);
    if (current.state !== 'moving') {
        updateState(state);
    }
});


controller.status = function() {
    return buildPublicState(current);
};

controller.open = function() {
    if (current.state === 'closed') {
        updateState('moving');
        controlPin.set(1, function() {
            setTimeout(function() {
                updateState(readState());
            }, DOOR_DELAY*1000)
        });
    }
};

controller.close = function() {
    if (current.state === 'open') {
        updateState('moving');
        controlPin.set(0, function() {
            setTimeout(function() {
                console.debug(readState());
                updateState(readState());
            }, DOOR_DELAY*1000);
        });
    }
};

controller.on("a", function() {});

exports.controller = controller;
