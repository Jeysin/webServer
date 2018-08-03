var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var checkToken=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var token=req.query.Token;
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
			request({
				url: config.serverAddress,
				method: 'POST',
				json: true,
				headers: {
					'Content-Type':'application/json'
				},
				body: {
					Action: 'CheckToken',
					token: token
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					var isRight=body.isRight;
					if(isRight==='yes'){
						res.json({Code:0, Msg:'success'});
					}else{
						res.json({Code:8400, Msg:'The token is expire or invalid'});
					}
				}else{
					res.json({Msg: err, Code:9001});
					console.log('error:'+err);
				}
			});
		}else{
			res.json({Msg: 'SessionId is invalid or expired', Code: 8002});
			console.log('Msg: SessionId is invalid or expired, Code: 8002');
		}
	});

}
module.exports=checkToken;
