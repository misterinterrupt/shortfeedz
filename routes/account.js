var Stream = require('../models/stream')
    redis = require('redis');

function protect(req, res, next) {
  if( req.isAuthenticated() ) next();
  else {
    req.authenticate('twitter', function(error, authenticated) {
      if( error ){
        next(new Error("Problem authenticating"));
        console.dir(error);
      } else {
        if( authenticated === true) next();
        else if( authenticated === false ) next(new Error("Access Denied!"));
        else {
          // Abort processing, browser interaction was required (and has happened/is happening)
        }
      }
    })
  }
}

module.exports = function (app) {
  
  // User accounts entry point
  // TODO:: stream based functionallity will eventually be split out to app.get('/account/stream')
  app.get('/account', protect, function (req, res) {
    // user account home
    var client = redis.createClient();
    client.on('ready', function (err) {
      Stream.getAll(client, 0, function (err, streams) {
        if(err) throw err;
        client.quit();
        client = null;
        res.render('account/index', { streams : streams });
      });
    });
    
  });
  
  // TODO:: protect these routes!

  // post creation of new stream
  app.post('/account/stream', function (req, res) {
    var terms = req.body.terms;
    var client = redis.createClient();
    client.on('ready', function (err) {
      if(err) throw err;
      var stream = new Stream(client, terms);
      stream.save(function (err, stream) {
        if(err) throw err;
        client.quit();
        terms = client = null;
        res.redirect('/account');
      });
    });
  });


    
  // update a stream
  app.put('/account/stream/:id([0-9]+)', function (req, res) {
    
    var terms = req.body.terms,
        updateId = req.params.id,
        client = redis.createClient();
    
    client.on('ready', function (err) {
      if(err) throw err;
      Stream.get(client, updateId, function (err, stream) {
        if(err) {
          console.error(err);
          res.send(500);
        }
        stream.update({terms:terms}, function(err, stream) {
          if(err) {
            console.error(err);
            res.send(500);
          }
          delete stream.redisClient;
          res.contentType('json');
          res.send(stream);
          client.quit();
          terms = updateId = client = null;
        });
      });
    });
  });
  
  // delete a stream
  app.del('/account/stream/:id([0-9]+)', protect, function (req, res) {
    var updateId = req.params.id,
        client = redis.createClient();
    
    client.on('ready', function (err) {
      if(err) throw err;
      
      Stream.destroy(client, updateId, function (err) {
        if(err) {
          console.error(err);
          res.send(500);
        }
        res.send(200);
        client.quit();
        terms = updateId = client = null;
      });
      
    });
  });
}