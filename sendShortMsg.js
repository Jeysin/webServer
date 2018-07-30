var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var sendShortMsg=function(req, res){
	var path=req.path;
	var phoneNum=req.query.PhoneNum;
	var authCode=parseInt(Math.random()*900000+100000);
	console.log('Request path:'+path);
	console.log('phoneNum is:'+phoneNum);
	console.log('authCode is:'+authCode);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type':'application/json'
			},
			body: {
				Action : path.substring(1, path.length),
				phoneNum: phoneNum,
				random: authCode
			}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				//设置验证码五分钟有效
				redisStore.set(phoneNum, authCode);
				redisStore.expire(phoneNum, 5*60);
				res.json({Msg: 'successful', Code: 0});
			}else{
				res.json({Msg: err, Code:9001});
				console.log('error:'+err);
			}
		});
	}else{
		res.json({Msg: 'sessionid is invalid', Code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
}
module.exports=sendShortMsg;
