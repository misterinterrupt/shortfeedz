var sys = require('sys'),
    http = require('http'),
    io = require('socket.io'),
    OAuth = require('oauth').OAuth,
    StreamParser = require('./StreamParser.js');
/*
 *  @name       TwitReader constructor function
 *  @requires   <Object> arg_object  one key: 'oauth_config' should
 *              hold the result of require('../config/oauth_config')
 *              with all the twitter keys and secrets filled in usefully.
 *              Optionally the key 'method' may hold any value in TwitReader.METHODS[] 
 */
var TwitReader = module.exports = function (arg_obj) {
  this.VERSION='0.0.3',
  this.REQUESTMETHODS = {'TRACK' : 'track',     //TODO:: Finish implementing all methods
                        'FOLLOW' : 'follow'},   //TODO:: Add multiple Method usage
  this.DEFAULTS = {'requestUrl':'http://stream.twitter.com/1/statuses/filter.json',
                  'method' : this.REQUESTMETHODS.TRACK,
                  'keywords' : ['Beyonce']};
                  
  if(arg_obj.oauth_config) {
    this.oauth_config = arg_obj.oauth_config;
  } else {
    return console.error('Error: Cannot create TwitReader without oauth_config in arguments object');
  }
  this.twitterRequestMethod = arg_obj.method || this.DEFAULTS.method;
  this.twitterRequestKeywords = Array.isArray(arg_obj.keywords) ? arg_obj.keywords : this.DEFAULTS.keywords;
  this.twitterRequestUrl = this.DEFAULTS.requestUrl;
  console.log('Creating new Twitter object');
  var that = this;
  this.name = "Twitter";
  this.parser = new StreamParser('\r\n');
  /*this.loadConfig(config_path, function (json) {
    that.onConfigLoaded(json);
  });*/
  this.onConfigLoaded(arg_obj.oauth_config);
};


TwitReader.prototype.loadConfig = function (path, cb) {
  console.log('Loading config');
  if(path) this.importJSONConfig(path, cb);
  else console.error("No path specified for config");
};

TwitReader.prototype.importJSONConfig = function (path, cb) {
  console.log('Importing JSON config');
  var json_config = {};
  fs.readFile(path, function (err, data) {
    if(err) throw err;
    json_config = JSON.parse(data.toString());
    cb(json_config);
  });
};

TwitReader.prototype.onConfigLoaded = function (json) {
  console.log('Config loaded');
  this.config = json,
  this.requestTokenUrl = "https://api.twitter.com/oauth/request_token",
  this.accessTokenUrl = "https://api.twitter.com/oauth/access_token",
  this.consumerKey = this.config.consumer_key,
  this.consumerSecret = this.config.consumer_secret,
  this.accessToken = this.config.access_token,
  this.accessTokenSecret = this.config.access_token_secret,
  this.requestString = "",
  
  this.headers = {
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'ShortFeedz/TwitReader' + this.VERSION
  };
  
  this.buildRequestString();
  this.initOauth();
};

TwitReader.prototype.buildRequestString = function () {
  var keywordParamString = "",
      keywords = this.twitterRequestKeywords; // what happens when it's 400 keywords?

  keywords.forEach( function (val, i, arr) {
    keywordParamString += val;
    keywordParamString += (arr.length-1===i)?'':','; // to comma or not to comma
  });
  
  this.requestString = this.twitterRequestUrl + "?" + this.twitterRequestMethod + "=" + keywordParamString;
}

TwitReader.prototype.initOauth = function () {
  var that = this;
  console.log('Initializing OAuth');
  this.oauth = new OAuth(this.requestTokenUrl,
                         this.accessTokenUrl,
                         this.consumerKey,
                         this.consumerSecret,
                         "1.0",
                         null,
                         "HMAC-SHA1");
  
  this.request = this.oauth.get(this.requestString, this.accessToken, this.accessTokenSecret);
  
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

TwitReader.prototype.onRequestData = function (chunk) {
  this.parser.parseChunk(chunk);
};

TwitReader.prototype.onRequestError = function (err) {
  throw err;
};



//////////////////////////////
var count = 0,
	lastc = 0;
 
TwitReader.prototype.writeToStream = function (data) {
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