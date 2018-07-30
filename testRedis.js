var redisStore=require('./redisStore');
redisStore.set('jeysin', 'jiangjiaxian');
redisStore.expire('jeysin', 10);
var myTimer=setInterval(function(){
	redisStore.get('jeysin', function(err, reply){
		if(reply){
			console.log('I live:'+reply);
			redisStore.ttl('jeysin', function(err, expireTime){
				console.log('expireTime:'+expireTime);
			});
		}else{
			clearTimeout(myTimer);
			console.log('I expried');
			var val=redisStore.get('jeysin');
			console.log('val:'+val);
			redisStore.ttl('jeysin', function(err, expireTime){
				console.log('expireTime:'+expireTime);
			});
			redisStore.quit();
		}
	});
}, 1000);
