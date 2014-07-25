var express = require('express');
var router = express.Router();
var session = require('../lib/session');
var logger = require('morgan');

// verify session on all garage API calls
router.use(session.enforce_valid_token);

router.post('/status', function (req, res) {
    res.json({door: 'open', duration: '200', img: 'webcam.jpg?token=' + req.body.token + '&dt=1' });
});

router.post('/open', function (req, res) {
    logger('open');
    res.end('');
});

router.post('/close', function (req, res) {
    logger('close');
    res.end('');
});

module.exports = router;
