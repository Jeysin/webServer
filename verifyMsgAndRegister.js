var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var hadOpenId=function(openid, req, res){
	var phoneNum=req.query.PhoneNum;
	redisStore.hget('OpenId_UnionId', openid, function(err, unionid){
		if(!err){
			request({
				url: config.serverAddress,
				method: 'POST',
				json: true,
				headers: {
					'Content-Type':'application/json'
				},
				body: {
					Action : 'VerifyWhiteList',
					phoneNum: phoneNum,
					openId: openid,
					unionId: unionid
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					var isInWhiteList=body.isInWhiteList;
					if(isInWhiteList==='yes'){
						res.json({Msg: 'successful', Code: 0});
					}else{
						res.json({Msg: 'The phone number is not in white list', Code: 8005});
					}
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
var hadMyAuthCode=function(authCode, myAuthCode, req, res){
	if(authCode===myAuthCode){
		var SessionId=req.query.SessionId;
		redisStore.hget('SessionId_OpenId', SessionId, function(err, openid){
			if(!err){
				hadOpenId(openid, req, res);
			}else{
				res.json({Msg: '/hadMyAuthCode: The error is unknow',Code:9001});
				console.log(err);
			}
		});
	}else{
		res.json({Msg: 'The short message is invalid', Code: 8004});
		console.log('The short message is invalid, errorCode: 8004');
	}
};
var verifyMsgAndRegister=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		var phoneNum=req.query.PhoneNum;
		var authCode=req.query.AuthCode;
		if(phoneNum && authCode){
			redisStore.get(phoneNum, function(err, myAuthCode){
				if(!err){
					hadMyAuthCode(authCode, myAuthCode, req, res);
				}else{
					res.json({Msg: 'verifyMsgAndRegister: The error is unknow',Code:9001});
					console.log(err);
				}
			});
		}else{
			res.json({Msg: 'The phone number or authcode is null', Code: 8003});
			console.log('The phone number or authcode is null, errorCode: 8003');
		}
	}else{
		res.json({Msg: 'sessionid is invalid', Code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
}
module.exports=verifyMsgAndRegister;
