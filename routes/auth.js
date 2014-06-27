var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.send('respond with a resource');
});

router.get('/api/status', function (req, res) {
    res.json({
        's': 'open',
        'd': 123
    });
});

router.get('/api/open', function (req, res) {
});

router.get('/api/close', function (req, res) {
});

router.get('/api/logout', function (req, res) {
    delete req.session.authenticated;
    res.redirect('/');
});

module.exports = router;
