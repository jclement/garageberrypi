var express = require('express');
var router = express.Router();
var session = require('../lib/session');
var logger = require('morgan');
var garage = require('../lib/garage');
var config = require('../lib/config');
var fs = require('fs');
var session = require('../lib/session');

function doIfAuthenticated(req, res, action) {
    var username = (req.query.username || '').toLowerCase();
    var password = req.query.password;
    session.login(username, password).then(
        function (token) {
            action(req, res);
        },
        function (message) {
            res.json({status: false, message: message});
        });
};

router.get('/status', function (req, res) {
    doIfAuthenticated(req, res, function(req, res) {
        var status = garage.state();
        res.json(status);
    });
});

router.get('/open', function (req, res) {
    doIfAuthenticated(req, res, function(req, res) {
        garage.open();
        res.end('');
    });
});

router.get('/close', function (req, res) {
    doIfAuthenticated(req, res, function(req, res) {
        garage.close();
        res.end('');
    });
});

router.get('/toggle', function (req, res) {
    doIfAuthenticated(req, res, function(req, res) {
        var state = garage.state();
        if (state === 'open') {
            garage.close();
            res.end('closing');
        }
        if (state === 'closed') {
            garage.open();
            res.end('opening');
        }
        res.end('noop');
    });
});

module.exports = router;
