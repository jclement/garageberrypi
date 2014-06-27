var express = require('express');
var nconf = require('nconf');
var _ = require('underscore');
var router = express.Router();

router.get('/', function (req, res) {
    // if session: show index else login
    if (req.session.authenticated) {
        res.render('index');
    } else {
        res.render('login');
    }
});

router.post('/', function (req,res) {
    var username = req.body.username;
    var password = req.body.password;

    // Replace with something that doesn't suck
    var success = false;
    _.each(nconf.get('logins'), function(login) {
        if (login.username.toUpperCase() === username.toUpperCase() && login.password === password) {
            req.session.authenticated = true;
            req.session.authenticatedUser = login.username;
            success = true;
        }
    });

    if (success) {
        res.render('index')
    } else {
        res.render('login', {message: 'Login Failed!', username: username});
    }
});

module.exports = router;
