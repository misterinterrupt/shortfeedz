var flow = require('flow');
/*
 * crud for stream objects
 * right now, these are just 
 * a terms string and an id
 */

var Stream = module.exports = function Stream(redisClient, terms) {
  
  this.redisClient = redisClient;
  
  if (typeof terms != 'undefined') { // normal creation
    this.terms = terms;
    this.createdAt = new Date;
  } else { // if we are going to manually set properties after using .get
    this.terms = null;
    this.createdAt = null;
  }
  
  this.redisClient.on("error", function (err) {
    console.log("Redis error " + that.redisClient.host + ":" + that.redisClient.port + " - " + err);
  });
};

Stream.prototype.save = function (fn) {
  var that = this;
  this.redisClient.incr('global:nextStreamId', function(err, reply) {
    that.id = reply;
    that.redisClient.hmset('streams:'+ that.id, 'terms', that.terms, 'createdAt', that.createdAt);
    // replace ids with a real user id when users are set up
    that.redisClient.lpush('users:0:streams', that.id);
    fn(err, that.id);
  });
};

Stream.prototype.update = function(data, fn){
  this.updatedAt = new Date;
  for (var key in data) {
    if (undefined != data[key]) {
      this[key] = data[key];
    }
  }
  this.save(fn);
};

Stream.prototype.destroy = function (fn) {
  exports.destroy(this.id, fn);
};

Stream.prototype.countUserStreams = function (redisClient, userId, fn) {
  redisClient.llen('users:' + userId + ':streams', function (err, reply) {
    fn(reply);
  });
};

module.exports.getAll = function(redisClient, userId, fn) {
  var cb = fn;
  var collect = flow.define(
    function (redisClient, userId, fn) {
      redisClient.lrange('users:' + userId  + ':streams', 0, -1, this);
    },
    function(err, reply) {
      if(err) throw err;
      if(reply.prototype.toString.call(obj) === '[object Array]') {
        flow.serialForEach(
          function (val) {
            redisClient.hmget('streams:' + val, this);
          },
          function (err, reply) {
            if(err) throw err;
            // get a hash of our stream
            this.streams.push(reply);
          },
          function () { // finished
            cb(this.streams);
          }
        ), // end serialForEach
      } else {
        // nothing in the reply.. 
      }
    }); // end flow.define
  collect();
};

module.exports.get = function(redisClient, id, fn) {
  redisClient.hgetall('streams:'+id, function(err, reply) {
    var stream = reply;
    stream.id = id;
    fn(null, stream);
  });
};

Stream.prototype.destroy = function(id, fn) {
  
  if (this.get('streams:' + id)) {
    // replace ids with a real user id when users are set up
    this.redisClient.rem('users:0:streams:', 1, id);
    fn();
  } else {
    fn(new Error('stream ' + id + ' does not exist'));
  }
};

Stream.prototype.finish = function() {
  this.redisClient.quit();
};