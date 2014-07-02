var express = require('express');
var _ = require('underscore');
var router = express.Router();
var nconf = require('nconf');
var fs = require('fs');
var session = require('../lib/session');
var path = require('path');

router.get('/', function (req, res) {
    res.render('index', {title: 'GarageberryPi'});
});

// Serve static webcam image unless we have a valid session
router.get('/webcam.jpg', function(req, res) {
    var token = req.query.token;
    res.writeHead(200, {'Content-type':'image/jpeg'});
    if (token) {
        session.verify(token, function(isValid) {
            fs.exists(nconf.get("webcamurl"), function(exists) {
              if (exists && isValid) {
                fs.createReadStream(nconf.get("webcamurl")).pipe(res);
              } else {
                fs.createReadStream(nconf.get("webcamstaticurl")).pipe(res);
              }
            });
        });
    } else {
        fs.createReadStream(nconf.get("webcamstaticurl")).pipe(res);
    }
});

module.exports = router;
