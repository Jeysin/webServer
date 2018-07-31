var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var hadOpenId=function(openid, phoneNum, invitationCode, res){
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
					Action : 'VerifyInvitationCode',
					phoneNum: phoneNum,
					invitationCode: invitationCode,
					openId: openid,
					unionId: unionid
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					var isSuccessful=body.isSuccessful;
					if(isSuccessful==='yes'){
						res.json({Msg: 'successful', Code: 0});
					}else{
						res.json({Msg: 'The invitation code is invalid', Code: 8006});
					}
				}else{
					res.json({Msg: err, Code:9001});
					console.log('/hadOpenId:request:'+err);
				}
			});
		}else{
			res.json({Msg: '/hadOpenId: The error is unknow',Code:9001});
			console.log('/hadOpenId:'+err);
		}
	});
}
var verifyInvitationCode=function(req, res){
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
			var phoneNum=req.query.PhoneNum;
			var invitationCode=req.query.InvitationCode;
			redisStore.hget('SessionId_OpenId', session_id, function(err, openid){
				if(!err){
					hadOpenId(openid, phoneNum, invitationCode, res);
				}else{
					res.json({Msg: '/verifyInvitationCode: The error is unknow',Code:9001});
					console.log('/verifyInvitationCode:'+err);
				}
			});
		}else{
			res.json({Msg: 'sessionid is invalid', Code: 8002});
			console.log('sessionid is invalid, errorCode: 8002');
		}
	});	
}
module.exports=verifyInvitationCode;
