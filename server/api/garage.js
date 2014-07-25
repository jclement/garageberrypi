var express = require('express');
var router = express.Router();
var session = require('../lib/session');
var logger = require('morgan');
var garage = require('../lib/garage');
var config = require('../lib/config');
var fs = require('fs');

// verify session on all garage API calls
router.use(session.enforce_valid_token);

// watch webcam image for changes and update webcam serial number
var webcam_serial = new Date().valueOf();
fs.watchFile(config("webcam:url"), function(curr,prev) {
  webcam_serial = new Date().valueOf();
});

router.post('/status', function (req, res) {
    var last_serial = req.body.serial;
    var cnt = 200;
    var test = function() {
      var status = garage.state(); 
      status.img = 'webcam.jpg?token=' + req.body.token + '&serial=' + webcam_serial;
      // if webcam image has a later serial number, use that
      if (webcam_serial > status.serial) {
        status.serial = webcam_serial;
      }
      // if last serial seen == current serial, spin for a while
      if (status.serial === last_serial && cnt-- > 0) {
        setTimeout(test, 100);
      } else {
        res.json(status);
      }
    };
    test();
});

router.post('/open', function (req, res) {
    garage.open();
    res.end('');
});

router.post('/close', function (req, res) {
    garage.close();
    res.end('');
});

module.exports = router;
