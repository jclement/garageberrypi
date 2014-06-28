var express = require('express');
var _ = require('underscore');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index', {title: 'GarageberryPi'});
});

module.exports = router;
