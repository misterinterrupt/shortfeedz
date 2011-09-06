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
  var saveIt = flow.define(
    function (stream, cb) {
      this.stream = stream;
      // only increment if we need to, i.e. new vs update
      if(typeof this.stream.id === 'undefined') {
        this.stream.redisClient.incr('global:nextStreamId', this);
      } else {
        this(null, null);
      }
    },
    function (err, id) {
      if(err) throw err;
      // only set id if there is an id to set
      if(typeof id === 'number') this.stream.id = id;
      
      var streamProps = {
          'id' : this.stream.id,
          'terms' : this.stream.terms,
          'createdAt' : this.stream.createdAt
        };
        
      // set updatedAt if this was an update
      if(typeof this.stream.updatedAt !== 'undefined') streamProps.updatedAt = this.stream.updatedAt;
      
      this.stream.redisClient.hmset('streams:' + this.stream.id, streamProps, this);
    },
    function (err) {
      if(err) throw err;
      // replace ids with a real user id when users are set up
      this.stream.redisClient.lpush('users:0:streams', this.stream.id, this);
    },
    function (err) {
      if(err) throw err;
      fn(err, this.stream);
    } ); // end flow.define
  saveIt(that, fn)
};

Stream.prototype.update = function(data, fn){
  this.updatedAt = new Date;
  if (undefined != data.terms) {
    this.terms = data.terms;
  }
  this.save(fn);
};

Stream.prototype.destroy = function (fn) {
  module.exports.destroy(this.id, fn);
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

module.exports.destroy = function(id, fn) {
  
  if (this.get('streams:' + id)) {
    // replace ids with a real user id when users are set up
    this.redisClient.rem('users:0:streams:', 1, id);
    fn();
  } else {
    fn(new Error('stream ' + id + ' does not exist'));
  }
};