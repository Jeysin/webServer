var request=require('request');
var querystring=require('querystring');
var express=require('express');
var redis=require('redis');
var crypto=require('crypto');
var bodyParser=require('body-parser');
//连接redis
var PORT=6379;
var HOST='127.0.0.1';
var PASSWD='123456';
var OPTS={auth_pass : PASSWD};
var redisStore=redis.createClient(PORT, HOST, OPTS);
redisStore.on('connect', function(){
	console.log('redis connect successful');
});
//使用JSON解析工具
var app=express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//监听登录请求
app.get('/onLogin', function(req, res){
	let code=req.query.code;
	console.log("onLogin: code:"+code);

	var getData=querystring.stringify({
		appid:'wx9d86fb50c899df5a',
		secret:'12345',
		js_code:code,
		grant_type:'authorization_code'
	});
	var address="http://127.0.0.1:8889/onLogin2";
	var url=address+"?"+getData;
	var session_id="";
	request.get(url, function(err, res){
		if(!err && res.statusCode===200){
			var json=JSON.parse(res.body);
			var openid=json.openid;
			var session_key=json.session_key;
			console.log('openid:'+openid);
			console.log('session_key:'+session_key);
			//根据openid和session_key用md5算法生成session_id
			var hash=crypto.createHash('md5');
			hash.update(openid+session_key);
			session_id=hash.digest('hex');
			console.log('session_id:'+session_id);
			//将session_id存入redis并设置超时时间为30分钟
			redisStore.set(session_id, openid+session_key);
			redisStore.expire(session_id, 1800);
		}else{
			console.log(err);
			//res.json(err);
		}
	});
	//将session_id传递给客户端
	res.json({sessionid: session_id});
	//request({
	//	//uri: 'https://api.weixin.qq.com/sns/jscode2session',
	//	uri: 'http://127.0.0.1:8889/onLogin2',
	//	method: 'GET',
	//	json :{
	//		grant_type: 'authorization_code',
	//		//填上自己的appid和secret
	//		appid: 'wx9d86fb50c899df5a',
	//		secret: '12345',
	//		js_code: code
	//	}
	//}, function(err, res, data){
	//	if(!err && res.statusCode===200){
	//		console.log('openid:'+data.openid);
	//		console.log('session_key:'+data.session_key);
	//		//根据openid和session_key用md5算法生成session_id
	//		var hash=crypto.createHash('md5');
	//		hash.update(data.openid);
	//		var session_id=hash.digest('hex');
	//		//将session_id存入redis并设置超时时间为30分钟
	//		redisStore.set(session_id, openid+session_key);
	//		redisStore.expire(session_id, 1800);
	//		//将session_id传递给客户端
	//		res.json({sessionid: session_id});
	//	}else{
	//		console.log(err);
	//		res.json(err);
	//	}
	//});
});
app.get('/onLogin2', function(req, res){
	let code=req.js_code;
	let appid=req.appid;
	let secret=req.secret;
	console.log('onLogin2: code is:'+code);
	console.log('onLogin2: appid is:'+appid);
	console.log('onLogin2: secret is:'+secret);
	req.json({openid:'abcdefg', session_key:'ABCDEFG'});
});
app.get('/products', function(req, res){
	let session_id=req.header('sessionid');
	let session_val=redisStore.get(session_id);
	if(session_val){
		console.log('session_id is not ok');
	}else{
		console.log('session_id is ok');
	}
});
var server=app.listen(8888, function(){
	var host=server.address().address;
	var port=server.address().port;
	console.log('address is http://%s:%s', host, port);
});
