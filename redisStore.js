var redis=require('redis');
var config=require('./config');
//连接redis
var opts={auth_pass : config.redisPasswd};
var redisStore=redis.createClient(config.redisPort, config.redisHost, opts);
redisStore.on('connect', function(){
	console.log('redis connect successful');
});
module.exports=redisStore;
