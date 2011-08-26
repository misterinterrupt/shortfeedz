/* 
 * ShortFeedz
 * eventually a project to make short urls for custom twitter filters..
 * for now, a quick n' dirty script to get some streaming messages in the shell
 * help from this: https://github.com/ciaranj/node-oauth/wiki/Interacting-with-Twitter
 */

// in order to get args, use this:
var args = process.argv.slice();

// Command line args
var OAUTHCONFIG = args[2],
    KEYWORD = args[3] || "beyonce";

if (!OAUTHCONFIG)
  return console.log("Usage: node server.js <keyword>");

var HOST="127.0.0.1",
    PORT=4444,
    VERSION='0.0.1',
    sys = require('sys'),
    fs = require('fs'),
    http = require('http'),
    io = require('socket.io'),
    OAuth = require('oauth').OAuth,
    StreamParser = require('./StreamParser.js');

var Twitter = module.exports = function (config_path) {
  console.log('Creating new Twitter object');
  var that = this;
  this.name = "Twitter";
  this.parser = new StreamParser('\r\n');
  this.loadConfig(config_path, function (json) {
    that.onConfigLoaded(json);
  });
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
  
  this.request = this.oauth.get("http://stream.twitter.com/1/statuses/filter.json?track=" + KEYWORD, "6273562-TEd79uPCTS907WXBuK9lhidSsaDIhYCrDGplHGokuc", "w7wu5X6kv2EMicL74n84rCfj711z8sT8iE9d9X8k");
  
  this.parser.addListener('data', this.writeToStream);
  
  this.request.addListener('response', function (response) {
    response.setEncoding('utf8');
    response.addListener('data', function (chunk) {
      that.parser.parseChunk(chunk);
    });
    response.addListener('end', function () {
      console.log('--- END ---');
    });
  });
  this.request.end();
  /*
  this.oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
    if (error) {
      sys.puts('error : ' + error.statusCode + ' ' + error.data);
    } else {
      that.onOAuthRequestToken(error, oauth_token, oauth_token_secret, results);
    }
  });
  */
};
/*
Twitter.prototype.onOAuthRequestToken = function (error, oauth_token, oauth_token_secret, results) {
  if (error) {
    sys.puts('error : ' + error.statusCode + ' ' + error.data)
  } else {
    sys.puts('oauth_token :' + oauth_token);
    sys.puts('oauth_token_secret :' + oauth_token_secret);
    sys.puts('Request token results :' + sys.inspect(results));
    sys.puts("Requesting access token");
    
    var that = this;
    this.oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, function (error, oauth_access_token, oauth_access_token_secret, results2) {
      that.onOAuthAccessToken(error, oauth_access_token, oauth_access_token_secret, results2);
    });
  }
};

Twitter.prototype.onOAuthAccessToken = function (error, oauth_access_token, oauth_access_token_secret, results2) {
  if (error) {
    sys.puts('error : ' + error.statusCode + ' ' + error.data);
  } else {
    sys.puts('oauth_access_token :' + oauth_access_token);
    sys.puts('oauth_token_secret :' + oauth_access_token_secret);
    sys.puts('Access token results :' + sys.inspect(results2));
    sys.puts("Requesting resource");
    var that = this;
    this.oauth.getProtectedResource("http://stream.twitter.com/1/statuses/filter.json?track=" + KEYWORD, "GET", "6273562-TEd79uPCTS907WXBuK9lhidSsaDIhYCrDGplHGokuc", "w7wu5X6kv2EMicL74n84rCfj711z8sT8iE9d9X8k", function (error, data, response) {
      that.onProtectedResource(error, data, response); 
    });
  }
};*/

Twitter.prototype.onRequestData = function (chunk) {
  this.parser.parseChunk(chunk);
};

Twitter.prototype.onRequestError = function (err) {
  throw err;
};



//////////////////////////////
var	count = 0,
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







