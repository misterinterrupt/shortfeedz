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
  app.get('/account', protect, function (req, res) {
    // user account home
    var client = redis.createClient();
    client.on('ready', function (err) {
      Stream.getAll(client, 0, function (err, streams) {
        if(err) throw err;
        res.render('account/index', { streams : streams });
      });
    });
  });
  
  // form for creation of new stream
  app.post('/account/stream', protect, function (req, res) {
    var terms = req.body.terms;
    var client = redis.createClient();
    client.on('ready', function (err) {
      var stream = new Stream(client, terms);
      stream.save(function (err, stream) {
        if(err) throw err;
        res.redirect('/account');
      });
    });
  });
  // post the form here
  app.post('/account/new', protect, function (req, res) {
    var data = req.body.post;
    
  });
}