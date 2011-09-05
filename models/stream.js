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
    
    var streamProps = {
        'id' : that.id,
        'terms' : that.terms,
        'createdAt' : that.createdAt
      };
    
    if(typeof that.updatedAt !== 'undefined') streamProps.updatedAt = that.updatedAt;
    
    that.redisClient.hmset('streams:' + that.id, streamProps);
    // replace ids with a real user id when users are set up
    that.redisClient.lpush('users:0:streams', that.id);
    fn(err, that);
  });
};

Stream.prototype.update = function(data, fn){
  this.updatedAt = new Date;
  if (undefined != data.terms) {
    this.terms = data.terms;
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
  
  var collect = flow.define(
    function (client, userId, cb) {
      this.cb = cb;
      this.client = client;
      this.client.lrange('users:' + userId  + ':streams', 0, -1, this);
    },
    function (err, reply) {
      if(err) throw err;
      
      // we are going to need some of this scope to come along for serialForEach
      var streams = this.streams = [],
          cb = this.cb,
          innerClient = this.client;
          
      if(Object.prototype.toString.call(reply) === '[object Array]') {
        
        flow.serialForEach(reply, 
          function (val) {
            this.client = innerClient;
            this.client.hgetall('streams:' + val, this);
          },
          function (err, reply) {
            if(err) throw err;
            // get a hash of our stream
            streams.push(reply);
          },
          function (err) { // finished
            if(err) throw err;
            //console.dir(streams);
            cb(null, streams);
          }
        ); // end serialForEach
        
      } else {
        // user has no streams reply.. 
      }
      
    }
  ); // end flow.define
  collect(redisClient, 0, fn);
};

module.exports.get = function(redisClient, id, fn) {
  var client = redisClient;
  redisClient.hgetall('streams:'+id, function(err, reply) {
    var stream = new Stream(client);
    stream.id = id;
    stream.createdAt = reply.createdAt;
    stream.terms = reply.terms;
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