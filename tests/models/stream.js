var assert  = require('assert'),
    flow = require('flow'),
    Stream = require('../../models/stream'),
    redis = require('redis'),
    client = redis.createClient();
// get a testing framework!  ;)

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
    assert.equal(idType, 'number', 'id was not set to a number, it was ' + idType );
    console.log('A Stream gets an id upon Stream.save');
    this();
  },
  function testGet (err) {
    if(err) throw err;
    this.s2 = new Stream(this.client);
    Stream.get(this.client, 1, this);
  },
  function testGetReturn (err, stream) {
    if(err) throw err;
    this.s2 = stream;
    assert.equal(typeof this.s2.terms, 'string', 'prop terms missing on stream object after get');
    assert.equal(typeof this.s2.createdAt, 'string', 'prop createdAt missing on stream object after get');
    console.log('A stream can be retrieved from redis via Stream.get');
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
    console.log('A users streams can be retrieved from redis via Stream.getAll');
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

