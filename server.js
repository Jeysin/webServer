var app=require('express')();
var request=require('request');
var querystring=require('querystring');
var redis=require('redis');
var crypto=require('crypto');
var bodyParser=require('body-parser');
var config=require('./config');
var fs=require('fs');
var http=require('http');
var https=require('https');

//读取https证书
var privateKey=fs.readFileSync('./private.pem', 'utf8');
var certificate=fs.readFileSync('./file.crt', 'utf8');
var credentials={key: privateKey, cert: certificate};
//连接redis
var opts={auth_pass : config.redisPasswd};
var redisStore=redis.createClient(config.redisPort, config.redisHost, opts);
redisStore.on('connect', function(){
	console.log('redis connect successful');
});
//使用JSON解析工具
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//开启监听
//var httpServer=http.createServer(app);
//httpServer.listen(config.httpPort, function(){
//	console.log('HTTP server is running on http://localhost:%s', config.httpPort);
//});
var httpsServer=https.createServer(credentials, app);
httpsServer.listen(config.httpsPort, function(){
	console.log('HTTPS server is running on https://localhost:%s', config.httpsPort);
});
//监听登录请求
app.get('/onLogin', function(req, res){
	let code=req.query.code;
	console.log("onLogin: code:"+code);

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
			console.log('openid: '+openid);
			console.log('session_key: '+session_key);
			if(openid && session_key){
				//根据openid和session_key用md5算法生成session_id
				var hash=crypto.createHash('md5');
				hash.update(openid+session_key);
				session_id=hash.digest('hex');
				console.log('session_id:'+session_id);
				//将session_id存入redis并设置超时时间为30分钟
				redisStore.set(session_id, openid+":"+session_key);
				redisStore.expire(session_id, 1800);
				将session_id传递给客户端
				res.set("Content-Type", "application/json");
				res.json({sessionid: session_id});
			}else{
				res.json({warning: 'code is invalid'});
			}
		}else{
			console.log(err);
		}
	});
});
app.get('/', function(req, res){
	let code=req.query.code;
	console.log('code:'+code);
	if(req.protocol==='https'){
		res.status(200).json({code:code});
	}else{
		res.status(200).send('Welcome, this is HTTP!');
	}
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
app.get('/insertToMysql', function(req, res){
	fs.readFile('./OperateProduct.json', 'utf8', function(err, data){
		if(err){
			return console.error(err);
		}
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.parse(data.toString())
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
			}else{
				console.error('err:'+err);
			}
		});
	});
});
app.get('/GetBankList', function(req, res){
	let session_id=req.query.sessionid;
	let session_val=redisStore.get(session_id);
	if(session_val){
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json'
			},
			body: {"Action":"GetBankList"}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
			}else{
				console.error('err:'+err);
			}
		});
	}else{
		res.json({warning: 'sessionid is invalid'});
	}
});
app.get('/GetProductsInfoList', function(req, res){
	let session_id=req.query.sessionid;
	let session_val=redisStore.get(session_id);
	if(session_val){
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json'
			},
			body: {"Action": "GetBankList"}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
			}else{
				console.error('err:'+err);
			}
		});
	}else{
		res.json({warning: 'sessionid is invalid'});
	}
});
