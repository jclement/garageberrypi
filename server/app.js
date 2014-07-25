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

watcher.register('open', 60 * 2, notify);
watcher.register('open', 60 * 5, notify);
watcher.register('open', 60 * 10, function(d) {notify(d, 1);});
watcher.register('open', 60 * 30, function(d) {notify(d, 1);});

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
