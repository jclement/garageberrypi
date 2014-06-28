// Common libraries
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var fs = require('fs');
var redis = require('redis');
var client = redis.createClient();
require('colors');

// GBP Libraries
var session = require('./lib/session.js');

// GBP Routes
var routes_root = require('./routes/index');
var routes_api_auth = require('./routes/api/auth');

// Catch-all for Redis errors
client.on('error', function (err) {
    console.log("Error " + err);
});

var app = express();

// honor proxy header since this will, probably, run behind nginx
app.enable('trust proxy');

// Wire up Socket.IO for communication with JS UI
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Parse configuration
nconf.argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json')});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Watch webcam file for changes and notify clients
fs.watchFile(nconf.get('webcamurl'), function(curr, prev) {
    io.emit('updatedPicture');
});

// Authentication on socket.io connections
io.use(function(socket, next) {
    if (socket.request && socket.request._query && socket.request._query.token) {
        session.verify(socket.request._query.token, function(isValid, sessionData) {
            if (isValid) {
                socket.session = sessionData;
                next();
            } else {
                next(new Error("BAD_TOKEN"));
            }
        });
    } else {
        next(new Error("NO_TOKEN"));
    }
});

// Log helper.  Logs actions to redis, console and all active clients
var log = function(operation, socket) {
    var date = new Date();
    console.log(operation.red + ' by ' + socket.session.username.blue + ' @ ' + date.toISOString().green + ' - ' + socket.client.request.headers['user-agent'].yellow);
    io.emit("log", {
        operation: operation,
        user: socket.session.username,
        date: date,
        agent: socket.client.request.headers["user-agent"]
    });
};

var ioCount = 0;
io.on('connection', function (socket) {
    log("login", socket);
    socket.broadcast.emit('connectionCount', ++ioCount);
    socket.emit('connectionCount', ioCount);
    socket.emit('state', {'status':'open','duration':765});
    socket.emit('updatedPicture');
    socket.on('open', function () {
        log('open', socket);
    });
    socket.on('close', function () {
        log('close', socket);
    });
    socket.on('disconnect', function () {
        log("logout", socket);
        socket.broadcast.emit('connectionCount', --ioCount);
    });
});

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes_root);
app.use('/api/auth', routes_api_auth);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = {app: app, http: http};
