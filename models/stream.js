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
    // increment global:nextStreamId if we are saving a new stream
    function (stream, cb) {
      this.stream = stream;
      // only increment if we need to, i.e. new vs update
      if(typeof this.stream.id === 'undefined') {
        this.stream.redisClient.incr('global:nextStreamId', this);
      } else {
        this(null, null);
      }
    },
    // save the object as a hash key e.g. hmset streams:[stream id] id stream.id terms stream.terms createdAt stream.createdAt
    function (err, id) {
      if(err) throw err;
      
      // set id if there is an id to set
      if(typeof id === 'number') {
        this.stream.id = id;
      }
      
      var streamProps = {
          'id' : this.stream.id,
          'terms' : this.stream.terms,
          'createdAt' : this.stream.createdAt
        };
        
      // set updatedAt if this was an update 
      if(typeof this.stream.updatedAt !== 'undefined') {
        streamProps.updatedAt = this.stream.updatedAt;
      }
      
      this.stream.redisClient.hmset('streams:' + this.stream.id, streamProps, this);
    },
    // push stream id onto user's streams if it isn't already there
    function (err) {
      if(err) throw err;
      var that = this;
      // replace ids with a real user id when users are set up
      this.stream.redisClient.lrange('users:0:streams', 0, -1, function (err, list) {
        if (Object.prototype.toString.call(list) === '[object Array]') {
          var inList = false;
          for(var i=0; i<list.length; i++) {
            if(list[i] === that.stream.id) {
              inList = true;
              break;
            }
          }
          if(!inList){
            that.stream.redisClient.lpush('users:0:streams', that.stream.id, that);
          } else {
            that();
          }
        } else {
          that();
        }
      });
    },
    // get back to business
    function (err) {
      if(err) throw err;
      fn(null, this.stream);
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
  module.exports.destroy(this.redisClient, this.id, fn);
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
      var that = this;
      this.streams = [];
      
      if(Object.prototype.toString.call(reply) === '[object Array]') {
        
        var multi = this.client.multi();
        
        for (var i=0; i<reply.length; i++) {
          multi.hgetall('streams:' + reply[i]);
        }
        multi.exec(function(err, replies){
          if(err) throw err;
          that.streams = replies;
          that.cb(null, that.streams);
        });
      } else {
        // user has no streams reply.. 
        this.cb(null, this.streams);
      }
    }
  ); // end flow.define
  collect(redisClient, 0, fn);
};

module.exports.get = function(redisClient, id, fn) {
  redisClient.hgetall('streams:' + id, function(err, reply) {
    if(err || reply === null) {
      fn(err, {});
    } else {
      var stream = new Stream(redisClient);
      stream.id = reply.id;
      stream.createdAt = reply.createdAt;
      stream.terms = reply.terms;
      fn(null, stream);
    }
  });
};

module.exports.destroy = function(redisClient, id, fn) {
  var client = redisClient;
  client.hgetall('streams:' + id, function (err, stream) {
    if(err) {
      throw err;
    } else if (typeof stream.id === 'undefined'){
      fn(new Error('stream ' + stream.id + ' does not exist'));
    } else {
      // replace ids with a real user id when users are set up
      client.lrem('users:0:streams:', -1, stream.id, function (err) {
        if(err) throw err;
        client.del('streams:' + stream.id, function (err) {
          fn(err);
        });
      });
    }
  });
};