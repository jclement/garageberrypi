var gpio = require('gpio');
var events = require('events');
var _ = require('underscore');

var DOOR_STATUS_PIN = 4;
var DOOR_TOGGLE_PIN = 25;
var DOOR_DELAY = 12; // time in seconds for door to move
var OPEN_TRIGGERS = [
    {state: 'open', threshold: 30},
    {state: 'open', threshold: 60},
    {state: 'open', threshold: 60*5},
    {state: 'open', threshold: 60*10},
    {state: 'open', threshold: 60*30}
]

var current = {
    state: null,
    stateTime: null,
    triggers: []
};

setInterval(function() {
    _.each(current.triggers, function(trigger) {
        if ((new Date() - current.stateTime) > trigger.threshold) {
            trigger.func();
        }
    });
}, 1000);

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
            stateTime: new Date(),
            triggers: []
        };
        if (state === 'open') {
            // register triggers for door open
            _.each(OPEN_TRIGGERS, function(trigger) {
                current.triggers.push({
                    threshold: trigger.threshold,
                    func: _.once(function() {
                        controller.emit('trigger', trigger);
                    })
                });
            });
        }
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
                updateState(readState());
            }, DOOR_DELAY*1000);
        });
    }
};

controller.on("a", function() {});

exports.controller = controller;
