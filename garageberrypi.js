var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var redis = require('redis');
var client = redis.createClient();

client.on('error', function (err) {
    console.log("Error " + err);
});

var routes = require('./routes/index');
var auth = require('./routes/auth');
var session = require('./lib/session.js');

var app = express();
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

setInterval(function() {
    io.emit('tick');
}, 2000);

io.set('authorization', function(data, accept) {
    if (data && data._query && data._query.token) {
        session.test(data._query.token, function(isValid, sessionData) {
            if (isValid) {
                console.log(sessionData);
                data.session = sessionData;
                accept(null, true);
            } else {
                accept("BAD_TOKEN", false);
            }
        });
    } else {
        accept("NO_TOKEN", false);
    }
});

io.on('connection', function (socket) {
    //console.log(socket.data.session.username, 'connected');
    socket.on('open', function () {
        socket.emit('state', {'status':'open','duration':765});
    });
    socket.on('disconnect', function () {
        console.log('disconnected');
    });
});

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/auth', auth);

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
