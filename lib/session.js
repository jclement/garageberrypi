var redis = require('redis');
var client = redis.createClient();
var logger = require('morgan')('dev');
var crypto = require('crypto');
var _ = require('underscore');
var bcrypt = require('bcrypt');
require('colors');

//console.log(scrypt.passwordHashSync('test',0.1));
// if no users, insert new user with random password and log to console

var userPrefix = 'user:';
var sessionPrefix = 'session:';

client.on('error', function (err) {
    console.log("Redis error: %s", err);
    console.dir(err);
});

client.keys("user:*", function(err, res) {
    if (!res || res.length === 0) {
        crypto.randomBytes(5, function (ex, buf) {
            var password = buf.toString('hex');
            var salt = bcrypt.genSaltSync(10);
            var user = {
                username: 'demo',
                hashedPassword: bcrypt.hashSync(password, salt)
            };
            client.set(userPrefix + user.username, JSON.stringify(user), function(err) {
                if (!err) {
                    console.log("NOTE:".red + " added new user '" + user.username.blue + "' with password '" + password.blue + "'");
                }
            });
        });
    }
});


// generate a new random token
var generateToken = function (done) {
    crypto.randomBytes(48, function (ex, buf) {
        done(buf.toString('hex'));
    });
};

// verify valid token before we do something crazy and pass it to redis
var validateToken = function (token) {
    return _.isString(token) && token.length === 2 * 48;
};

// returns: {status: true, token: token} | {status: false, message: ''}
var login = function (username, password, done) {
    if (!username) {
        done("username is required", false);
        return;
    }
    if (!password) {
        done("password is required", false);
        return;
    }
    if (username !== username.toLowerCase()) {
        done("username must be lower case", false);
        return;
    }
    client.get(userPrefix + username, function (err, res) {
        if (res) {
            var user = JSON.parse(res);
            bcrypt.compare(password, user.hashedPassword, function (err, result) {
                if (!err && result) {
                    generateToken(function (token) {
                        data = {
                            token: token,
                            username: username,
                            date: new Date()
                        };
                        client.set(sessionPrefix + token, JSON.stringify(data), function (err, reply) {
                            if (!err) {
                                console.log("Successful login as %s", username);
                                done(null, token);
                            } else {
                                done(err, null);
                            }
                        });
                    });
                } else {
                    // password incorrect
                    done("Invalid username or password", null);
                }
            });
        }
    });
};

// verify session is still valid (done=function(err, status, sessionData)
var verify = function (token, done) {
    if (validateToken(token)) {
        client.get(sessionPrefix + token, function (err, res) {
            if (!err) {
                if (res) {
                    done(true, JSON.parse(res));
                } else {
                    done(false);
                }
            } else {
                done(false);
            }
        });
    } else {
        done(false);
    }
};

// remove token from redis
var logout = function (token, done) {
    if (validateToken(token)) {
        client.del(sessionPrefix + token, function (err) {
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
exports.verify = verify;
