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
    oauth_config = require('./oauth_config'),
    TwitReader = require('./lib/TwitReader'),
    StreamParser = require('./lib/StreamParser.js');

    var arg_obj = {'oauth_config' : oauth_config,
                   'keywords' :[KEYWORD]};

    var twit = new TwitReader(arg_obj),
        parser = new StreamParser(';');

    console.log('resuming stdin');

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (chunk) {
      process.stdout.write('got some data: ' + chunk);
      parser.parseChunk(chunk);
    });
    parser.on('data', function (data) {
      arg_obj.keywords = data;
      process.stdout.write('got some data: ' + data);
      twit = new TwitReader(arg_object);
    })



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

require('./routes/shortfeedz')(app);
require('./routes/account')(app);

if (!module.parent) {
  app.listen(PORT);
  console.log('ShortFeedz started at ' + HOST + ':' + PORT);

}



