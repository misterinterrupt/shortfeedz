/* 
 * ShortFeedz
 * eventually a project to make short urls for custom twitter filters..
 * for now, a quick n' dirty script to get some streaming messages in the shell
 */

// in order to get args, use this:
var args = process.argv.slice();


var HOST = "127.0.0.1",
    PORT = 4444,
    VERSION = '0.0.2',
    express = require('express'),
    auth = require('connect-auth'),
    jade = require('jade'),
    RedisStore = require('connect-redis')(express),
    oauth_config = require('./oauth_config'),
    TwitReader = require('./lib/TwitReader'),
    StreamParser = require('./lib/StreamParser.js');

var cmdTwitReader = function (oauth_config, keyword_arr) {
  
    var arg_obj = {'oauth_config' : oauth_config,
                   'keywords' :keyword_arr};
                   
    var twit = new TwitReader(arg_obj),
        stdin = process.stdin,
        stdout = process.stdout;
    stdout.write('\n\n\n\n\n:::: Twit Commander ::::\n');
    stdout.write('\nUsing keywords ' + arg_obj.keywords);
    stdout.write('\nType a search string and hit enter to change this running feed. \n\n\n\n\n');
    stdin.resume();
    stdin.setEncoding('utf8');
    
    stdin.on('data', function (chunk) {
      stdout.write('changing stream to: ' + chunk.toString());
      arg_obj['keywords'] = [chunk.toString().trim()];
      twit = null;  
      twit = new TwitReader(arg_obj);
    });
}

var app = module.exports = express.createServer();

// app.dynamicHelpers is middleware sugar for setting view-render-time vars
// i.e.
//  var messages = require('express-messages');
//  module.exports = function (req, res, next) {
//    res.locals.message = messages(req,res);
//    next();
//  }
app.dynamicHelpers({
  messages: require('express-messages')
});


app.configure( function () {
  
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'rootmusic', store: new RedisStore }));
  app.use(auth( {
    strategies: auth.Twitter(
      { consumerKey: oauth_config.consumerKey, 
        consumerSecret: oauth_config.consumerSecret,
      }),
    trace: true
  }) );
  app.use(app.router);

});

require('./routes/shortfeedz')(app);
require('./routes/account')(app);

if (!module.parent) {
  app.listen(PORT);
  console.log('ShortFeedz started at ' + HOST + ':' + PORT);

}

if(args[2]) {
  cmdTwitReader(oauth_config, [args[2]]);
}



