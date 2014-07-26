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
var config = require('./lib/config');
var html5cache = require('./lib/html5cache');
require('./lib/notify');

var route_authentication = require('./api/authentication');
var route_garage = require('./api/garage');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(logger('dev'));
app.use("/cache.manifest", html5cache.requestHandler);
app.use("/lib", express.static(path.join(__dirname, '..', 'bower_components')));
app.use('/api/auth', route_authentication);
app.use('/api/garage', route_garage);

app.get('/webcam.jpg', function (req, res) {
    var token = req.query.token;
    if (token) {
        // only server webcam images if authenticated
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
