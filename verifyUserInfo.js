var verifyUserInfo=function(sessionid, openid, unionid, res){
	request({
		url: config.serverAddress,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type':'application/json'
		},
		body: {
			Action : 'VerifyUserInfo',
			openId: openid,
			unionId: unionid
		}
	}, function(err, response, body){
		if(!err && response.statusCode==200){
			var isSuccessful=body.isSuccessful;
			if(isSuccessful==='yes'){
				res.json({SessionId: sessionid, Code:0, Msg:'success'});
			}else{
				res.json({Code:8200, Msg:'The user is not register'});
			}
		}else{
			res.json({Msg: err, Code:9001});
			console.log('error:'+err);
		}
	});
}
