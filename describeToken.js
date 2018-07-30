var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var describeToken=function(req, res){
	var path=req.path;
	var PsInfo=req.query.PsInfo;
	var BkCode=req.query.BkCode;
	var SprdId=req.querySprdId;
	console.log('Request path:'+path);
	var session_id=req.query.SessionId;
	redisStore.ttl(session_id, function(err, expireTime){
		if(err){
			res.json({Msg: '/sendShortMsg: The error is unknow',Code:9001});
			console.log(err);
			return;
		}
		if(expireTime>0){
			var openid=redisStore.hget('SessionId_OpenId', session_id);
			var unionid=redisStore.hget('OpenId_UnionId', openid);
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
			res.json({Msg: 'sessionid is invalid', Code: 8002});
			console.log('sessionid is invalid, errorCode: 8002');
		}
	});
}
module.exports=describeToken;
