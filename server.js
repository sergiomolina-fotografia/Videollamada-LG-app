// server.js - WebRTC TV App server for webOS
// Node.js 8.12.0 compatible, no external modules
var http = require('http');
var fs = require('fs');
var path = require('path');
var PORT = 8765;
var BASE = __dirname;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.json': 'application/json'
};

var server = http.createServer(function(req, res) {
  var url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  // Health check
  if (url === '/ping') {
    res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
    res.end('pong');
    return;
  }

  var filePath = path.join(BASE, url);
  var ext = path.extname(filePath);
  var mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found: ' + url);
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Cambridge TV server running on http://localhost:' + PORT);
});

server.on('error', function(e) {
  if (e.code === 'EADDRINUSE') {
    console.log('Port ' + PORT + ' already in use - server may already be running');
  } else {
    console.error('Server error:', e.message);
  }
});
