"use strict";

require('array.prototype.find');
var http = require('http');
var fs = require('fs');
var path = require('path');
var bunyan = require('bunyan');
var util = require('util');

var log_files = [
  { filename : '/var/log/system.log' },
  { filename : '/var/log/wifi.log' }, 
  { filename :'/Users/jake/test.log'}];
var API_KEY = 'bef3h27sh27s472g36dgjmdh';

var logger = bunyan.createLogger({name : 'lawg'});

var dispatcher = require('httpdispatcher');

dispatcher.setStatic('resources');
dispatcher.setStaticDirname('./');

var check_security = function(f) {
  return function(request, response) {
    if(API_KEY != request.params.key) {
      response.writeHead(404);
      response.write("Invalid or missing API key");
      response.end();
    } else {
      f(request, response);
  };
}};

dispatcher.onGet('/', check_security(function(request, response) {
  response.end(JSON.stringify(log_files));
}));

dispatcher.onGet('/lookup', check_security(function(request, response) {
  if(!request.params.partial) {
    response.end(JSON.stringify(log_files));
  } else {
    logger.info(request.params.partial);

    var results = [];

    log_files.forEach(function(current) {
      if(-1 != current.filename.indexOf(request.params.partial)) {
        results.push(current);
      }
    });

    logger.info(JSON.stringify(results));

    response.end(JSON.stringify(results));
  }
}));

dispatcher.onGet('/retrieve', check_security(function(request, response) {
  var result = {
    filename : request.params.filename,
    offset : 0,
    data : ''
  };

  if(!request) {
    logger.error('Missing request argument');
    response.end(JSON.stringify(result));
    return;
  }

  if(!request.params) {
    logger.error('Missing request parameters');
    response.end(JSON.stringify(result));
    return;
  }

  if(!request.params.filename) {
    logger.error('Missing filename');
    response.end(JSON.stringify(result));
    return;
  }

  if(!request.params.offset) {
    logger.error('Missing offset');
    response.end(JSON.stringify(result));
    return;
  }

  if(-1 > request.params.offset) {
    logger.error('Invalid file offset specified');
    response.end(JSON.stringify(result));
    return;
  }

  if(!(log_files.find(function(value, index, collection) { return request.params.filename == value.filename; }))) {
    logger.error('Filename ' + request.params.filename + ' specified not in available files');
    response.end(JSON.stringify(result));
    return;
  }

  if(-1 == request.params.offset) {
    result.offset = fs.statSync(request.params.filename).size;
    response.end(JSON.stringify(result));
    return;
  }

  //var bSize = 1024;
  var bSize = 1048576;

  var payload = new Buffer(bSize);

  var fd = fs.openSync(request.params.filename, 'r');
  var bytes = fs.readSync(fd, payload, 0, bSize, parseInt(request.params.offset));
  fs.close(fd);

  logger.info('Read ' + bytes + ' bytes');

  var result = {
    filename : request.params.filename,
    offset : bytes + parseInt(request.params.offset),
    data : payload.toString('utf8', 0, bytes)
  };

  response.end(JSON.stringify(result));
}));

try {
log_files.forEach(function(log_file) {
    if(!fs.statSync(log_file.filename).isFile()) {
      throw 'File is not present';
    }
  });
} catch(e) {
  logger.error(e);
}

dispatcher.beforeFilter(/\//, function(request, response, chain) {
  logger.info(request.method + ' : ' + request.url);
  chain.next(request, response, chain);
});

dispatcher.onError(function(request, response) {
  response.writeHead(404);
  response.end();
});

http.createServer(function(request, response) {
  dispatcher.dispatch(request, response);
}).listen(9100);
