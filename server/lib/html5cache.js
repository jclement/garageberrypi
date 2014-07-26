var fs = require('fs');
var _ = require('underscore');
var path = require('path');

/* ======================================================================  */

// These files are expected to be in client/ and are monitored for changes
// changes to these files will trigger new cache
var WATCHED = [
    'index.html',
    'js/main.js',
    'css/main.css'
    ];

var CACHED = WATCHED.concat([
    'css/bootstrap.min.css',
    'images/touch-icon-iphone-retina.png',
    'images/touch-icon-ipad-retina.png',
    'lib/jquery/dist/jquery.min.js',
    'lib/bootstrap/dist/js/bootstrap.min.js',
    'lib/underscore/underscore.js',
    'lib/angular/angular.min.js',
    'lib/angular-local-storage/angular-local-storage.min.js'
    ]);

var NETWORK = ['*'];

/* ======================================================================  */

// Restarting service always yields a new manifest version
var serial = new Date().valueOf();

// generate a fullpath for a given file
var fullpath = function(f) {
  return path.join(__dirname, '..', '..', 'client', f);
};

// Hook of FS watchers so that changes to DEV files update the serial number
_.each(WATCHED, function(file) {
  fs.watch(fullpath(file), function() {
    serial = new Date().valueOf();
  });
});

// Handle a request for cache manifest, turns off all caching of response
var requestHandler = function(req, res) {
  var tmp = 'CACHE MANIFEST\n# rev ' + serial + '\n\n';
  tmp += 'CACHE:\n';
  _.each(CACHED, function(f) {
    tmp += f + '\n';
  });
  tmp += '\nNETWORK:\n';
  _.each(NETWORK, function(f) {
    tmp += f + '\n';
  });
  res.set('Content-Type','text/application-manifest');
  res.set('Cache-Control','no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', 'Tue, 03 Jul 2001 06:00:00 GMT');
  res.send(tmp);
};

module.exports.requestHandler = requestHandler;
