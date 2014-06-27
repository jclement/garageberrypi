var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');

var routes = require('./routes/index');
var auth = require('./routes/auth');

var app = express();
app.enable('trust proxy');

// Wire up Socket.IO for communication with JS UI
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketioJwt = require('socketio-jwt');

// Parse configuration
nconf.argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json')});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

io.set('authorization', socketioJwt.authorize({
    secret: nconf.get('jwt:secret'),
    handshake: true
}));

io.sockets.on('connection', function(socket) {
    console.log(socket.handshake.username, 'connected');
    socket.on('open', function() {
        console.log('open');
    });
    socket.on('disconnect', function() {
        console.log('disconnected');
    });
});

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

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


module.exports = {app:app, http:http};
