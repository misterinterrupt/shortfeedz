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
    res.render('account/index');
  });
  
  // form for creation of new stream
  app.get('/account/new', protect, function (req, res) {
    res.render('account/new_stream', { stream : {} } );
  });
  // post the form here
  app.post('/account/new', protect, function (req, res) {
    var data = req.body.post;
    
  });
}