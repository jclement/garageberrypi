var debug = require('debug')('garageberrypi');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var path = require('path');
var logger = require('morgan');
var fs = require('fs');
var _ = require('underscore');

var session = require('./lib/session');
var garage = require('./lib/garage');
var watcher = require('./lib/watcher');
var config = require('./lib/config');
var request = require('request');

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

var route_authentication = require('./api/authentication');
var route_garage = require('./api/garage');

var app = express();

var notify = function (duration, priority) {
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
    _.each(config("notify:pushover"), function (settings) {
        var tmp = {};
        _.extend(tmp, msg, settings);
        request.post('https://api.pushover.net/1/messages.json').form(tmp);
    });
};

// low priority warnings
_.each([2,5], function(duration) {
  watcher.register('open', 60 * duration, notify);
});

// high priority warnings
_.each([10,20], function(duration) {
  watcher.register('open', 60 * duration, function(d) {notify(d, 1);});
});

// super high priority.. maybe someone will notice SMS
_.each([30,60,120], function(duration) {
  watcher.register('open', 60 * duration, function(d) {
    smsSend('Garage door open for ' + Math.round(duration/60) + ' minutes!');
  });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(logger('dev'));
app.use("/lib", express.static(path.join(__dirname, '..', 'bower_components')));
app.use('/api/auth', route_authentication);
app.use('/api/garage', route_garage);

app.get('/webcam.jpg', function (req, res) {
    var token = req.query.token;
    if (token) {
        session.verify(token).then(
            function () {
                fs.exists(config('webcam:url'), function (exists) {
                    if (exists) {
                        res.writeHead(200, {'Content-type': 'image/jpeg'});
                        fs.createReadStream(config('webcam:url')).pipe(res);
                    }
                    else {
                        res.end('file does not exist');
                    }
                });
            }, function () {
                res.end('invalid session');
            });
    } else {
        res.end('invalid session');
    }
});

var port = config('PORT') || 3000
http.createServer(app).listen(port, function () {
    debug('Started.  Listening on port ' + port);
})
