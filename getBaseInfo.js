var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var hadOpenId=function(openid, req, res){
	redisStore.hget('OpenId_UnionId', openid, function(err, unionid){
		if(err){
			res.json({Msg: 'hadOpenId:redisStore.hget: unknow error', Code: 9001});
			return;
		}
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type':'application/json'
			},
			body: {
				Action : 'GetBaseInfo',
				openId: openid,
				unionId: unionid
			}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
			}else{
				res.json({Msg: err, Code:9001});
				console.log('error:'+err);
			}
		});
	});
}
var getBaseInfo=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var SessionId=req.query.SessionId;
	if(!SessionId){
		res.json({Msg: 'SessionId can not be null', Code: 8003});
		console.log('Msg: SessionId can not be null, Code: 8003');
		return;
	}
	redisStore.ttl(SessionId, function(err, expireTime){
		if(err){
			res.json({Msg: 'redisStore.ttl: unknow error', Code: 9001})
			return;
		}
		if(expireTime>0){
			redisStore.hget('SessionId_OpenId', SessionId, function(err, openid){
				if(err){
					res.json({Msg: 'redisStore.hget: unknow error', Code: 9001});
					return;
				}
				hadOpenId(openid, req, res);
			});
		}else{
			res.json({Msg: 'SessionId is invalid or expired', Code: 8002});
			console.log('Msg: SessionId is invalid or expired, Code: 8002');
		}
	});
}
module.exports=getBaseInfo;
