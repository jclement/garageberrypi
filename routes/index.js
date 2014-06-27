var express = require('express');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index');
});

router.post('/login', function (req,res) {
    var username = req.body.username;
    var password = req.body.password;

    // Replace with something that doesn't suck
    var success = false;
    _.each(nconf.get('logins'), function(login) {
        if (login.username.toUpperCase() === username.toUpperCase() && login.password === password) {
            var profile = {
               username: login.username,
               date: new Date()
            };
            var token = jwt.sign(profile, nconf.get('jwt:secret'), {expiresInMinutes: 60*24*365});
            res.json({status: true, token: token});
            success = true;
        }
    });

    if (!success) {
        res.json({'status':false, 'message':'Invalid user or password'});
    }
});

module.exports = router;
