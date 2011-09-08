var assert  = require('assert'),
    flow = require('flow'),
    Stream = require('../../models/stream'),
    redis = require('redis'),
    client = redis.createClient();
// get a testing framework! these are linearly dependant :(

var streamTests = flow.define(
  
  
  function testSetup (redisClient) {
    console.log('setup for stream model');
    console.log('run from: ' + __filename);
    this.client = redisClient;
    this();
  },
  
  
  
  function testSave (err) {
    if(err) throw err;
    this.s1 = new Stream(this.client, 'save');  
    this.s1.save(this);
  },
  function testSaveReturn (err, id) {
    if(err) throw err;
    var idType = typeof this.s1.id;
    assert.notEqual(idType, NaN, 'id was NaN');
    assert.equal(idType, 'number', 'id was not set to a number, upon Stream.save it was ' + idType );
    console.log('A Stream gets an id upon Stream.save');
    this();
  },
  
  
  
  function testGet (err) {
    if(err) throw err;
    this.s2 = {};
    Stream.get(this.client, 1, this);
  },
  function testGetReturn (err, stream) {
    if(err) throw err;
    this.s2 = stream;
    assert.equal(typeof this.s2.terms, 'string', 'prop terms missing on stream object after Stream.get');
    assert.equal(typeof this.s2.createdAt, 'string', 'prop createdAt missing on stream object after Stream.get');
    console.log('A stream is retrieved from redis via Stream.get');
    this();
  },
  
  
  
  function testGetAll (err) {
    if(err) throw err;
    var strms = {};
    Stream.getAll(this.client, 0, this);
  },
  function testGetAllReturn (err, streams) {
    this.allStreams = streams; 
    assert.equal(Object.prototype.toString.call(this.allStreams), '[object Array]', 'An array was not returned from Stream.getAll');
    assert.equal(this.allStreams.length > 0, true, 'Stream.getAll returned 0 objects');
    console.log('A user\'s streams are retrieved from redis via Stream.getAll');
    this();
  },
  
  
  function testUpdate (err) {
    if(err) throw err;
    var testReturn = this,
        params = { terms:'updated ' + new Date },
        s3 = this.s3 = new Stream(this.client, 'save for update');
    
    this.s3.save(function (err, stream) {
      if(err) throw err;
      testReturn.s3 = stream;
      testReturn.s3.update(params, testReturn);
    });
  },
  
  
  
  function testUpdateReturn (err, stream) {
    if(err) throw err;
    var updatedAtType = Object.prototype.toString.call(this.s3.updatedAt),
        createdAtType = Object.prototype.toString.call(this.s3.createdAt);
    assert.equal(this.s3.id, stream.id, 'The id changed from ' + stream.id + ' to ' + this.s3.id + ' while updating.')
    assert.equal(this.s3.terms.indexOf('updated '), 0, 'prop terms on stream object should be "update" after Stream.update, it was ' + this.s3.terms);
    assert.equal(typeof updatedAtType, 'string', 'prop updatedAt missing on stream object after Stream.update, it was ' + updatedAtType);
    assert.equal(typeof createdAtType, 'string', 'prop createdAt missing on stream object after Stream.update, it was ' + createdAtType);
    console.log('A stream\'s props are updated via Stream.update');
    this();
  },
  
  
  
  function testDestroy (err) {
    if(err) throw err;
    // create a stream
    this.s5 = new Stream(this.client, 'destroy');
    var checkDestroyed = this;
    // save a stream
    this.s5.save(function (err, stream) {
      if(err) throw err;
      
      checkDestroyed.s5 = stream;
      // test out stream.destroy
      checkDestroyed.s5.destroy(function (err) {
        if(err) throw err;
        // to check redis directly for streams:[id] it will return null if it's gone
        // use: checkDestroyed.client.hexists('streams:' + id - 1, checkDestroyed);
        Stream.get(checkDestroyed.client, checkDestroyed.s5.id, checkDestroyed);
      });
    });    
  },
  function testDestroyReturn (err, stream) {
    if(err) throw err;
    this.s5 = stream;
    assert.equal(typeof this.s5.id, 'undefined', 'stream was not destroyed by Stream.destroy');
    assert.equal(typeof this.s5.createdAt, 'undefined', 'stream was not destroyed by Stream.destroy');
    assert.equal(typeof this.s5.terms, 'undefined', 'stream was not destroyed by Stream.destroy');
    
    console.log('A stream is removed from redis via Stream.destroy');
    this();
  },
  
  
  
  function testTearDown (err) {
    if(err) throw err;
    console.log('tearDown')
    process.exit();
  }
  
  
  
);



client.on('ready', function () {
  console.log("Redis connected at " + client.host + ":" + client.port);
  streamTests(this);
});

