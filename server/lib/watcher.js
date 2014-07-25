var garage = require('./garage');
var _ = require('underscore');

var triggers = [];

var register = function (expectedState, expectedDuration, callback) {
    var triggered = false;
    var trigger = {
        process: function (currentState, currentDuration) {
            if (triggered) return;
            if (expectedState === currentState && currentDuration >= expectedDuration) {
                triggered = true;
                callback(currentDuration);
            }
        },

        reset: function () {
            triggered = false;
        }

    };
    triggers.push(trigger);
    return trigger;
}

garage.on('changed', function (state) {
    _.each(triggers, function (t) {
        t.reset();
    });
});

setInterval(function () {
    var state = garage.state();
    if (!state) {
        return;
    }
    var duration = (new Date().getTime() - state.timestamp.getTime()) / 1000;
    _.each(triggers, function (t) {
        t.process(state.door, duration);
    });
}, 500);

module.exports.register = register;
