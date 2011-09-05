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
    assert.equal(idType, 'number', 'id was not set to a number, upon Stream.save it was ' + idType );
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
    assert.equal(typeof this.s2.terms, 'string', 'prop terms missing on stream object after Stream.get');
    assert.equal(typeof this.s2.createdAt, 'string', 'prop createdAt missing on stream object after Stream.get');
    console.log('A stream are retrieved from redis via Stream.get');
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
    var s3 = this.s3 = new Stream(this.client),
    testReturn = this,
    params = { terms:'update' },
    update = function (err, stream) {
        s3 = stream;
        s3.update(params, testReturn);
      };    
    Stream.get(this.client, 1, update);
  },
  function testUpdateReturn (err, stream) {
    if(err) throw err;
    this.s4 = stream;
    var updatedAtType = Object.prototype.toString.call(this.s4.updatedAt);
    assert.equal(this.s4.terms, 'update', 'prop terms on stream object should be "update" after Stream.update, it was ' + this.s4.terms);
    assert.equal(updatedAtType, '[object Date]', 'prop updatedAt missing on stream object after Stream.update, it was ' + updatedAtType);
    console.log('A stream\'s props are updated via Stream.update');
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

