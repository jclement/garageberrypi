var express = require('express');
var session = require('../lib/session');
var _ = require('underscore');
var router = express.Router();

router.post('/login', function (req,res) {
    var username = req.body.username;
    var password = req.body.password;
    session.login(username, password, function(err, token) {
        if (err) {
            res.json({status:false, message:'Invalid user or password'});
        } else {
            res.json({status: true, token: token});
        }
    });
});

router.post('/logout', function (req,res) {
    var token = req.body.token;
    session.logout(token, function(err) {
        if (err) {
            res.json({status:false, message:'Logout failed'});
        } else {
            res.json({status: true});
        }
    });
});

router.post('/test', function (req,res) {
    var token = req.body.token;
    session.test(token, function(err, isValid) {
        if (!isValid) {
            res.json({status: false, message: err});
        } else {
            res.json({status: true});
        }
    });
});

module.exports = router;

