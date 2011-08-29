/* 
 * ShortFeedz
 * eventually a project to make short urls for custom twitter filters..
 * for now, a quick n' dirty script to get some streaming messages in the shell
 * help from this: https://github.com/ciaranj/node-oauth/wiki/Interacting-with-Twitter
 */

// in order to get args, use this:
var args = process.argv.slice();

// Command line args
var KEYWORD = args[3] || "beyonce";

if (!args[3])
  console.log("Using keyword Beyonce");

var HOST="127.0.0.1",
    PORT=4444,
    VERSION='0.0.1',
    sys = require('sys'),
    fs = require('fs'),
    http = require('http'),
    io = require('socket.io'),
    oauth_config = require('./oauth_config'),
    OAuth = require('oauth').OAuth,
    StreamParser = require('./StreamParser.js');

var Twitter = module.exports = function (config_path) {
  console.log('Creating new Twitter object');
  var that = this;
  this.name = "Twitter";
  this.parser = new StreamParser('\r\n');
  /*this.loadConfig(config_path, function (json) {
    that.onConfigLoaded(json);
  });*/
  this.onConfigLoaded(oauth_config);
};

Twitter.prototype.loadConfig = function (path, cb) {
  console.log('Loading config');
  if(path) this.importJSONConfig(path, cb);
  else console.error("No path specified for config");
};

Twitter.prototype.importJSONConfig = function (path, cb) {
  console.log('Importing JSON config');
  var json_config = {};
  fs.readFile(path, function (err, data) {
    if(err) throw err;
    json_config = JSON.parse(data.toString());
    cb(json_config);
  });
};

Twitter.prototype.onConfigLoaded = function (json) {
  console.log('Config loaded');
  this.config = json;
  this.requestTokenUrl = "https://api.twitter.com/oauth/request_token";
  this.accessTokenUrl = "https://api.twitter.com/oauth/access_token";
  this.consumerKey = this.config.consumer_key;
  this.consumerSecret = this.config.consumer_secret;
  this.accessToken = this.config.access_token;
  this.accessTokenSecret = this.config.access_token_secret;
  
  this.headers = {
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'shortfeedz/' + VERSION
  }
  this.initOauth();
};

Twitter.prototype.initOauth = function () {
  var that = this;
  console.log('Initializing OAuth');
  this.oauth = new OAuth(this.requestTokenUrl,
                         this.accessTokenUrl,
                         this.consumerKey,
                         this.consumerSecret,
                         "1.0",
                         null,
                         "HMAC-SHA1");
  
  this.request = this.oauth.get("http://stream.twitter.com/1/statuses/filter.json?track=" + KEYWORD, this.accessToken, this.accessTokenSecret);
  
  this.parser.addListener('data', this.writeToStream);
  
  this.request.addListener('response', function (response) {
    
    if(response.statusCode !== 200) {
      console.error('\nO(aut)h no! Twitter stream request didn\'t return a 200.\n\n' + 
                    'Headers follow:' + response.client._httpMessage._header + 
                    '\nStatus: ' + response.statusCode);
    }
    
    response.setEncoding('utf8');
    
    response.addListener('data', function (chunk) {
      that.parser.parseChunk(chunk);
    });
    
    response.addListener('end', function () {
      console.log('--- END ---');
    });
    
  });
  
  this.request.end();

};

Twitter.prototype.onRequestData = function (chunk) {
  this.parser.parseChunk(chunk);
};

Twitter.prototype.onRequestError = function (err) {
  throw err;
};



//////////////////////////////
var count = 0,
	lastc = 0;
 
Twitter.prototype.writeToStream = function (data) {
	count++;
	if ( typeof data === 'string' )
		sys.puts(data);
	else if ( data.text && data.user && data.user.screen_name )
		sys.puts('"' + data.text + '" -- ' + data.user.screen_name);
	else if ( data.message )
		sys.puts('ERROR: ' + sys.inspect(data));
	else
		sys.puts(sys.inspect(data));
};

// just try it out inline
var t = new Twitter('oauth_config.json');







