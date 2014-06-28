var redis = require('redis');
var client = redis.createClient();
var logger = require('morgan')('dev');
var crypto = require('crypto');

client.on('error', function (err) {
    console.log("Redis error: %s", err);
});

var sessionPrefix = 'session:';

// generate a new random token
var generateToken = function(done) {
    crypto.randomBytes(48, function(ex, buf) {
        done(buf.toString('hex'));
    });
};

// verify valid token before we do something crazy and pass it to redis
var validateToken = function(token) {
    return true;
};

// returns: {status: true, token: token} | {status: false, message: ''}
var login = function(username, password, done) {
    if (username === password) {
        generateToken(function(token) {
            data = {
                token: token,
                username: username,
                date: new Date()
            };
            console.log(token);
            client.set(sessionPrefix + token, data, function (err, reply) {
                if (!err) {
                    console.log("Successful login as %s", username);
                    done(null, token);
                } else {
                    done(err, null);
                }
            });
        });
    } else {
        done("Invalid username or password", null);
    }
};

// verify session is still valid (done=function(err, status, sessionData)
var test = function(token, done) {
    if (validateToken(token)) {
        client.get(sessionPrefix + token, function(err, res) {
            if (!err) {
                if (res) {
                    done(true, res);
                } else {
                    done('BAD_TOKEN', false);
                }
            } else {
                done('REDIS_ERROR', false);
            }
        });
    } else {
        done('INVALID_TOKEN', false);
    }
};

// remove token from redis
var logout = function(token, done) {
    if (validateToken(token)) {
        client.del(sessionPrefix + token, function(err) {
            if (!err) {
                done(null);
            } else {
                logger.format("Redis error: %s", err);
                done(err);
            }
        });
    }
};

exports.login = login;
exports.logout = logout;
exports.test = test;
