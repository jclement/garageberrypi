var gpio = require('gpio');
var events = require('events');
var _ = require('underscore');

/* ================================================================================ */

// IO pin used for testing door status.  S/B high for door open.
var DOOR_STATUS_PIN = 4;

// IO pin used to toggle garage opener
var DOOR_TOGGLE_PIN = 25;

// Approximate delay for door to move from closed>open or open>closed so that
// we can show something useful while it's moving (and prevent further events)
var DOOR_DELAY = 12; // time in seconds for door to move

// Time based triggers for open, door.
var OPEN_TRIGGERS = [
    {state: 'open', threshold: 30},
    {state: 'open', threshold: 60},
    {state: 'open', threshold: 60*5},
    {state: 'open', threshold: 60*10, important:true},
    {state: 'open', threshold: 60*30, important:true}
]

/* ================================================================================ */

var controller = new events.EventEmitter();

var current = {
    state: null,
    stateTime: null,
    triggers: []
};

setInterval(function() {
    _.each(current.triggers, function(trigger) {
        if ((new Date().getTime() - current.stateTime.getTime())/1000 > trigger.threshold) {
            trigger.func();
        }
    });
}, 1000);

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
        duration: Math.round((new Date().getTime() - current.stateTime.getTime())/1000)
    };
}

var updateState = function(state) {
  console.log('udpate > ', state);
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
              controlPin.set(0, function(){});
            }, 1000);
            setTimeout(function() {
                updateState(readState());
            }, DOOR_DELAY*1000)
        });
    }
};

controller.close = function() {
    if (current.state === 'open') {
        updateState('moving');
        controlPin.set(1, function() {
            setTimeout(function() {
              controlPin.set(0, function(){});
            }, 1000);
            setTimeout(function() {
                updateState(readState());
            }, DOOR_DELAY*1000);
        });
    }
};

exports.controller = controller;
