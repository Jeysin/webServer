var crypto=require('crypto');
var request=require('request');
var querystring=require('querystring');
var config=require('./config');
var redisStore=require('./redisStore');
var WXBizDataCrypt=require('./WXBizDataCrypt')

var onLogin=function(req, res){
	let code=req.query.Code;
	var encryptedData=req.query.EncryptedData;
	var iv=req.query.Iv;
	console.log('Request path:'+req.path);
	console.log("code:"+code);
	var getData=querystring.stringify({
		appid: config.appid,
		secret: config.secret,
		js_code:code,
		grant_type:'authorization_code'
	});
	var url=config.wxAddress+"?"+getData;
	var session_id="";
	request.get(url, function(err, req){
		if(!err && req.statusCode===200){
			var json=JSON.parse(req.body);
			var openid=json.openid;
			var session_key=json.session_key;
			var unionid=json.unionid;
			console.log('openid: '+openid);
			console.log('session_key: '+session_key);
			if(openid && session_key){
				//根据openid和session_key用md5算法生成session_id
				var hash=crypto.createHash('md5');
				hash.update(openid+'yinhutong');
				session_id=hash.digest('hex');
				console.log('session_id:'+session_id);
				//将session_id存入redis并设置超时时间为20分钟
				redisStore.set(session_id, openid+":"+session_key);
				redisStore.expire(session_id, 1200);
				//将SessionId和openid关联起来存入数据库
				redisStore.hset('SessionId_OpenId', session_id, openid);
				//解密获取unionid并存入redis
				var pc = new WXBizDataCrypt(config.appid, session_key);
				var data = pc.decryptData(encryptedData, iv);
				redisStore.hset('OpenId_UnionId', openid, data.unionId);
				console.log('unionid:'+data.unionId);
				//将session_id发给前端
				res.json({SessionId: session_id, Code:0, Msg:'success'});
			}else{
				res.json({Msg: 'code is invalid', Code: 8001});
				console.log('code is invalid, errorCode: 8001');
			}
		}else{
			res.json({Msg: 'unknow errro', Code: 9001});
			console.log('unknow error, errorCode: 9001, err:'+err);
		}
	});
}
module.exports=onLogin;
