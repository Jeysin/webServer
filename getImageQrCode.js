var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var getImage=function(accessToken, url, res){
	var getImageUrl=config.imageCodeUrlA+'?access_token='+accessToken;
	request({
		url: getImageUrl,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type':'application/json'
		},
		body: {
			path: url
		}
	}, function(err, response, body){
		if(!err && response.statusCode==200){
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.end(body);
		}else{
			res.json({Msg: err, Code:9001});
			console.log('error:'+err);
		}
	});
}
var getImageQrCode=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var SessionId=req.query.SessionId;
	console.log('Url:'+req.query.Url);
	var getAccessTokenUrl=config.accessTokenUrl+
	'?grant_type=client_credential&appid='+config.appid+'&secret='+config.secret;
	request({
		url: getAccessTokenUrl,
		method: 'GET',
		json: true,
		headers: {
			'Content-Type':'application/json'
		},
	}, function(err, response, body){
		if(!err && response.statusCode==200){
			var access_token=body.access_token;
			getImage(access_token, req.query.Url, res);
		}else{
			res.json({Msg: err, Code:9001});
			console.log('error:'+err);
		}
	});
}
module.exports=getImageQrCode;
