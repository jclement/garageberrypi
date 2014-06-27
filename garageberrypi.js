var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var nconf = require('nconf');
var RedisStore = require('connect-redis')(session);

var routes = require('./routes/index');
var auth = require('./routes/auth');

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

io.on('connection', function(socket) {
    console.log("connected");
    socket.on('auth', function(authArgs) {
        console.log('auth');
        socket.on('open', function() {
            console.log('open');
        });
    });
    socket.on('disconnect', function(socket) {
        console.log('disconnected');
    });
});

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new RedisStore({
        ttl: 60000
    }),
    secret: nconf.get('session:secret')
}));

app.use('/', routes);

// Don't allow any API calls unless valid session
app.use('/auth', function(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.send('Not Authenticated!')
    }
});

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


module.exports = {app:app, http:http};
