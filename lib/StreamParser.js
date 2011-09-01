// this is a sweet little parser that inherits from EventEmitter
// mainly, when it emits a 'data' event, a callback needs to 
// catch the tweet and do something with it
// the names have been changed to protect me from completely copying and pasting
// https://github.com/jdub/node-twitter/blob/master/lib/parser.js
var EventEmitter = require('events').EventEmitter;

var StreamParser = module.exports = function StreamParser(delimiter) {
  EventEmitter.call(this);
  this.VERSION='0.0.2',
  this.delimiter = delimiter || '\n',
  this.buffer = new Buffer('', 'utf8');
  return this;
};
// btw, this is the inhrtitance pattern
StreamParser.prototype = Object.create(EventEmitter.prototype);

StreamParser.prototype.parseChunk = function (chunk) {
  this.buffer += chunk.toString('utf8');
  var index, json;
  
  // We have END?
  while ((index = this.buffer.indexOf(this.delimiter)) > -1) {
    json = this.buffer.slice(0, index);
    this.buffer = this.buffer.slice(index + this.delimiter.length);
    if (json.length > 0) {
      try {
        json = JSON.parse(json);
        this.emit('data', json);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }
};


