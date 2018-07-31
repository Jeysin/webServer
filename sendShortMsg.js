var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var sendMsgCore=function(session_id, phoneNum, authCode, res){
	redisStore.ttl('ShortMessage'+session_id, function(err, expireTime){
		if(expireTime<=0){
			console.log('phoneNum is:'+phoneNum);
			console.log('authCode is:'+authCode);
			request({
				url: config.serverAddress,
				method: 'POST',
				json: true,
				headers: {
					'Content-Type':'application/json'
				},
				body: {
					Action : 'SendShortMsg',
					phoneNum: phoneNum,
					random: authCode
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					//设置验证码五分钟有效
					redisStore.set(phoneNum, authCode);
					redisStore.expire(phoneNum, 5*60);
					//短信防刷,60秒内同一个sessionid只能发一次短信
					redisStore.set('ShortMessage'+session_id, '1');
					redisStore.expire('ShortMessage'+session_id, 60);
					res.json({Msg: 'successful', Code: 0});
				}else{
					res.json({Msg: err, Code:9001});
					console.log('error:'+err);
				}
			});
		}else{
			res.json({Msg:'Please send short message after 60s', Code: 8201});
		}
	});
}
var sendShortMsg=function(req, res){
	var path=req.path;
	var phoneNum=req.query.PhoneNum;
	var authCode=parseInt(Math.random()*900000+100000);
	console.log('Request path:'+path);
	var session_id=req.query.SessionId;
	redisStore.ttl(session_id, function(err, expireTime){
		if(err){
			res.json({Msg: '/sendShortMsg: The error is unknow',Code:9001});
			console.log(err);
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
					Action : 'VerifyUserByPhoneNum',
					phoneNum: phoneNum,
					random: authCode
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					var Exist=body.Exist;
					if(Exist==='no'){
						sendMsgCore(session_id, phoneNum, authCode, res);
					}else{
						res.json({Msg: 'The phone number was registered', Code: 8300});
					}
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
module.exports=sendShortMsg;
