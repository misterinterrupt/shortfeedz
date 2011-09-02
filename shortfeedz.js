/* 
 * ShortFeedz
 * eventually a project to make short urls for custom twitter filters..
 * for now, a quick n' dirty script to get some streaming messages in the shell
 */

// in order to get args, use this:
var args = process.argv.slice();

var KEYWORD = args[2] || ['Beyonce'];
console.log("Using keyword " + KEYWORD);

var HOST = "127.0.0.1",
    PORT = 4444,
    VERSION = '0.0.2',
    express = require('express'),
    auth = require('connect-auth'),
    jade = require('jade'),
    oauth_config = require('./oauth_config');
    
    // TwitReader = require('./lib/TwitReader');
// var arg_obj = {'oauth_config' : oauth_config,
//                'keywords' :[KEYWORD]};
  
// var t = new TwitReader(arg_obj);

// ShortFeedz app namespace object for routing functions
var routes = module.exports.routes = {};

// home page route
routes.root = function (req, res) {
  // serve something simple for the first course
  res.render("index");
};

routes.account = function (req, res) {
  // user account home
  res.render('account/index');
}

// stream url pickup
routes.stream_url = function (req, res) {
  // let em know what they asked for
  res.send(req.params['stream_url']);
  // verify this url, redirect to error if needed
  // start streaming into redis or find an in progress channel
  // subscribe to the published redis channel
}

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

var app = module.exports = express.createServer();

app.configure( function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'rootmusic' }));
  app.use(auth( {
    strategies: auth.Twitter(
      { consumerKey: oauth_config.consumerKey, 
        consumerSecret: oauth_config.consumerSecret,
      }),
    trace: true
  }) );
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.get('/', routes.root);
app.get('/account', protect, routes.account);
app.get('/:stream_url', routes.stream_url);

app.listen(PORT);


