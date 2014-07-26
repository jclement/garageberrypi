var config = require('./config');
var _ = require('underscore');
var request = require('request');
var watcher = require('./watcher');

var smsSend = function(msg) {};
(function() {
  if (config("notify:twilio:enable")) {
    var twilio = require('twilio')(config('notify:twilio:sid'), config('notify:twilio:token'));
    smsSend = function(msg) {
      _.each(config('notify:twilio:numbers'), function(number) {
        twilio.sendMessage({
          to: number,
          from: config('notify:twilio:from'),
          body: msg
        });
      });
    };
  }
})();

var pushover = function (duration, priority) {
    var msg = {
        message: 'Door has been open for ' + Math.round(duration) + ' seconds.',
        title: 'GarageberryPi',
        url: config('url'),
        priority: priority || 0,
        "url_title": "Open GarageberryPi"
    };
    if (duration > 60) {
        msg.message = 'Door has been open for ' + Math.round(duration / 60) + ' minutes.';
    }
    _.each(config("notify:pushover:devices"), function (settings) {
        var tmp = {};
        _.extend(tmp, msg, settings);
        request.post('https://api.pushover.net/1/messages.json').form(tmp);
    });
};

// low priority warnings (pushover)
_.each(config('notify:pushover:trigger_low'), function(duration) {
  watcher.register('open', 60 * duration, pushover);
});

// high priority warnings (pushover)
_.each(config('notify:pushover:trigger_high'), function(duration) {
  watcher.register('open', 60 * duration, function(d) {pushover(d, 1);});
});

// SMS notifications
_.each(config('notify:twilio:trigger'), function(duration) {
  watcher.register('open', 60 * duration, function(d) {
    smsSend('Garage door open for ' + Math.round(duration/60) + ' minutes!');
  });
});

console.log('notifications wired up');
