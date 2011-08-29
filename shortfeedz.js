/* 
 * ShortFeedz
 * eventually a project to make short urls for custom twitter filters..
 * for now, a quick n' dirty script to get some streaming messages in the shell
 */

// in order to get args, use this:
var args = process.argv.slice();

var KEYWORD = args[2] || ['Beyonce'];
console.log("Using keyword " + KEYWORD);

var HOST="127.0.0.1",
    PORT=4444,
    VERSION='0.0.2',
    oauth_config = require('./oauth_config'),
    TwitReader = require('./lib/TwitReader');

var arg_obj = {'oauth_config' : oauth_config,
               'keywords' :[KEYWORD]};

var t = new TwitReader(arg_obj);


