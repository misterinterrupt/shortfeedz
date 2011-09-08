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
  console.log('Creating new TwitReader');
  this.NAME = "TwitReader",
  this.VERSION = '0.0.3',
  this.USERAGENT = 'ShortFeedz/' + this.NAME,
  this.REQUESTMETHODS = {'TRACK' : 'track',     //TODO:: Finish implementing all methods
                        'FOLLOW' : 'follow'},   //TODO:: Add multiple Method usage
  this.DEFAULTS = {'requestUrl':'http://stream.twitter.com/1/statuses/filter.json',
                  'method' : this.REQUESTMETHODS.TRACK,
                  'stream_cb' : this.writeToStream,
                  'keywords' : ['Beyonce']};
                  
  if(arg_obj.oauth_config) {
    this.oauth_config = arg_obj.oauth_config;
  } else {
    return console.error('Error: Cannot create TwitReader without oauth_config in arguments object');
  }
  this.twitterRequestMethod = arg_obj.method || this.DEFAULTS.method,
  this.twitterRequestKeywords = Array.isArray(arg_obj.keywords) ? arg_obj.keywords : this.DEFAULTS.keywords,
  this.twitterRequestUrl = this.DEFAULTS.requestUrl,
  this.streamDataHandler = arg_obj.stream_cb || this.DEFAULTS.stream_cb
  
  this.config = arg_obj.oauth_config,
  this.requestString = "",
  this.oauth = {},
  this.request = {},
  this.headers = {
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': this.USERAGENT + this.VERSION
  };
  
  // gonna need one of these
  this.parser = new StreamParser('\r\n'),
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
  this.oauth = new OAuth(this.config.requestTokenUrl,
                         this.config.accessTokenUrl,
                         this.config.consumerKey,
                         this.config.consumerSecret,
                         "1.0",
                         null,
                         "HMAC-SHA1", null, this.headers);
  
  this.request = this.oauth.get(this.requestString, this.config.accessToken, this.config.accessTokenSecret);
  
  this.parser.addListener('data', this.streamDataHandler);
  
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
 
TwitReader.prototype.writeToStream = function (data) {
	if ( typeof data === 'string' )
		sys.puts(data);
	else if ( data.text && data.user && data.user.screen_name )
		sys.puts('"' + data.text + '" -- ' + data.user.screen_name);
	else if ( data.message )
		sys.puts('ERROR: ' + sys.inspect(data));
	else
		sys.puts(sys.inspect(data));
};