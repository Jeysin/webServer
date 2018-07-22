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
var morgan=require('morgan');
var fs=require('fs');

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
//开启日志
morgan.token('from', function(req, res){
	return req.query.from || '-';
});
morgan.token('time', function(req, res){
	return new Date();
});

var logStream=fs.createWriteStream(config.logFileName, {flag: 'a'});
app.use(morgan('myFormat', {stream: logStream}));
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
	let code=req.query.Code;
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
});
var handleFun=function(req, res){
	var path=req.path;
	var SortType=req.query.SortType;
	var SortMethod=req.query.SortMethod;
	var Amount=req.query.Amount;
	var Time=req.query.Time;
	var MinTime=req.query.MinTime;
	var MaxTime=req.query.MaxTime;
	console.log('Request path:'+path);
	console.log('SortType:'+SortType);
	console.log('SortMethod:'+SortMethod);
	console.log('Amount:'+Amount);
	console.log('Time:'+Time);
	console.log('MinTime:'+MinTime);
	console.log('MaxTime:'+MaxTime);
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
				SortType: SortType,
				SortMethod: SortMethod,
				Amount: Amount,
				Time: Time,
				MinTime: MinTime,
				MaxTime: MaxTime
			}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
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
app.get('/DescribeDepositProducts', handleFun);
app.get('/DescribeFinanceProducts', handleFun);
app.get('/DescribeLoanProducts', handleFun);
app.get('/DescribeBankList', function(req, res){
	var ServiceId=req.query.ServiceId;
	var path=req.query.path;
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
				ServiceId: ServiceId,
			}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				res.json(body);
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

var services = function(req,res){
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		var path = req.path;
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers:{'Content-Type':'application/json'},
			body:{'Action':path.substring(1,path.length)}
		},function(error,response,body){
			res.set("Content-Type","application/json");
			if(!error && response.statusCode === 200){
				res.json(body);
			}else{
				res.json({err:error});
				console.log('err '+error);
			}
		});
	}else{
		res.json({msg: 'sessionid is invalid', code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
}
app.get('/AllServices',services);
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
