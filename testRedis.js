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
			redisStore.ttl('jeysin', function(err, expireTime){
				console.log('expireTime:'+expireTime);
			});
			redisStore.get('jeysin', function(err, val){
				console.log('val:'+val);	
			});
			redisStore.quit();
		}
	});
}, 1000);
