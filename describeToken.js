var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var hadOpenId=function(openid, req, res){
	redisStore.hget('OpenId_UnionId', openid, function(err, unionid){
		if(!err){
			var path=req.path;
			var session_id=req.query.SessionId;
			var PsInfo=req.query.PsInfo;
			var BkCode=req.query.BkCode;
			var SprdId=req.query.SprdId;
			request({
				url: config.serverAddress,
				method: 'POST',
				json: true,
				headers: {
					'Content-Type':'application/json'
				},
				body: {
					Action : path.substring(1, path.length),
					SessionId : session_id,
					UnionId : unionid,
					PsInfo : PsInfo,
					BkCode : BkCode,
					SprdId : SprdId
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					res.json(body);
				}else{
					res.json({Msg: err, Code:9001});
					console.log('error:'+err);
				}
			});
		}else{
			res.json({Msg: '/hadOpenId: The error is unknow',Code:9001});
			console.log(err);
		}
	});
}
var describeToken=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_id=req.query.SessionId;
	if(!session_id){
		res.json({Msg: 'SessionId can not be null', Code: 8003});
		console.log('Msg: SessionId can not be null, Code: 8003');
		return;
	}
	redisStore.ttl(session_id, function(err, expireTime){
		if(err){
			res.json({Msg: '/sendShortMsg: The error is unknow',Code:9001});
			console.log(err);
			return;
		}
		if(expireTime>0){
			redisStore.hget('SessionId_OpenId', session_id, function(err, openid){
				if(!err){
					hadOpenId(openid, req, res);
				}else{
					res.json({Msg: '/describeToken: The error is unknow',Code:9001});
					console.log(err);
				}
			});
		}else{
			res.json({Msg: 'sessionid is invalid', Code: 8002});
			console.log('sessionid is invalid, errorCode: 8002');
		}
	});
}
module.exports=describeToken;
