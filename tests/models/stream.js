var assert  = require('assert'),
    Stream = require('../../models/stream'),
    redis = require('redis'),
    client = redis.createClient();
// get a testing framework!  ;)
client.on('ready', function () {
  
  console.log("Redis connected at " + client.host + ":" + client.port);
  
  /*var s1 = new Stream(this, 'save');  
  s1.save( function() {
    var idType = typeof s1.id;
    assert.notEqual(idType, NaN, 'id was NaN');
    assert.equal(idType, 'number', 'id was not set to a number, it was ' + idType );
    console.log('A Stream gets an id upon Stream.save');
  });*/
  
  /*var s2 = new Stream(this);
  Stream.get(this, 1, function (err, stream) {
    s2 = stream;
    assert.equal(typeof s2.terms, 'string', 'no terms on stream object after get');
    assert.equal(typeof s2.createdAt, 'string', 'no createdAt on stream object after get');
    console.log('A stream can be retrieved from redis via Stream.get');
  });*/
  
  
  //process.exit();  
});


