var express=require('express');
var request=require('request');
var querystring=require('querystring');
var redis=require('redis');
var crypto=require('crypto');
var bodyParser=require('body-parser');
var config=require('./config');
var fs=require('fs');
var http=require('http');
var https=require('https');
var app=express();

//读取https证书
var privateKey=fs.readFileSync('../https/Apache/3_openbank.qcloud.com.key', 'utf8');
var certificate=fs.readFileSync('../https/Apache/2_openbank.qcloud.com.crt', 'utf8');
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
app.use(express.static('public'));
//开启监听
var httpServer=http.createServer(app);
httpServer.listen(config.httpPort, function(){
	console.log('HTTP server is running on http://localhost:%s', config.httpPort);
});
var httpsServer=https.createServer(credentials, app);
httpsServer.listen(config.httpsPort, function(){
	console.log('HTTPS server is running on https://localhost:%s', config.httpsPort);
});
//监听登录请求
app.get('/onLogin', function(req, res){
	let code=req.query.code;
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
			console.log('openid: '+openid);
			console.log('session_key: '+session_key);
			if(openid && session_key){
				//根据openid和session_key用md5算法生成session_id
				var hash=crypto.createHash('md5');
				hash.update(openid+session_key);
				session_id=hash.digest('hex');
				console.log('session_id:'+session_id);
				//将session_id存入redis并设置超时时间为20分钟
				redisStore.set(session_id, openid+":"+session_key);
				redisStore.expire(session_id, 1200);
				//将session_id发给前端
				res.json({sessionid: session_id, errorCode: 0});
			}else{
				res.json({msg: 'code is invalid', code: 8001});
				console.log('code is invalid, errorCode: 8001');
			}
		}else{
			res.json({msg: 'unknow errro', code: 9001});
			console.log('unknow error, errorCode: 9001, err:'+err);
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
var handleFun=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.sessionid;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type':'application/json'
			},
			body: {"Action" : path.substring(1, path.length)}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
			}else{
				res.json({error: err});
				console.log('error:'+err);
			}
		});
	}else{
		res.json({msg: 'sessionid is invalid', code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
}
app.get('/GetBankList', handleFun);
app.get('/DescribeDepositProducts', handleFun);
app.get('/DescribeFinanceProducts', handleFun);
app.get('/DescribeLoanProducts', handleFun);
//app.post('/OperateProduct', function(req, res){
//	var path=req.path;
//	console.log('Request:'+path);
//	request({
//		url:config.serverAddress,
//		method: 'POST',
//		json: true,
//		headers: {
//			'Content-Type':'application/json'
//		},
//		body: req.body
//	}, function(err, response, body){
//		if(!err && response.statusCode==200){
//			res.json(body);
//		}else{
//			res.json({error: err});
//			console.log('error:'+err);
//		}
//	});
//});
//app.get('/insertToMysql', function(req, res){
//	console.log('/insertToMysql');
//	fs.readFile('./OperateProduct.json', 'utf8', function(err, data){
//		if(err){
//			return console.error(err);
//		}
//		request({
//			url: config.serverAddress,
//			method: 'POST',
//			json: true,
//			headers: {
//				'Content-Type': 'application/json'
//			},
//			body: JSON.parse(data.toString())
//		}, function(err, response, body){
//			if(!err && response.statusCode==200){
//				res.json(body);
//			}else{
//				console.error('err:'+err);
//			}
//		});
//	});
//});
