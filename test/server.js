var express=require('express');
var request=require('request');
var querystring=require('querystring');
var bodyParser=require('body-parser');
var config=require('./config');
var fs=require('fs');
var http=require('http');
var https=require('https');
var app=express();
var fs=require('fs');

var onLogin=require('./onLogin');
//读取https证书
var privateKey=fs.readFileSync('../https/Apache/3_openbank.qcloud.com.key', 'utf8');
var certificate=fs.readFileSync('../https/Apache/2_openbank.qcloud.com.crt', 'utf8');
var credentials={key: privateKey, cert: certificate};
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
var handleFun=function(req, res){
	var path=req.path;
	var SortType=req.query.SortType;
	var SortMethod=req.query.SortMethod;
	var Amount=req.query.Amount;
	var Time=req.query.Time;
	var MinTime=req.query.MinTime;
	var MaxTime=req.query.MaxTime;
	var Offset=req.query.Offset;
	var Length=req.query.Length;
	var ServiceId=req.query.ServiceId;
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
				MaxTime: MaxTime,
				Offset: Offset,
				Length: Length,
				ServiceId: ServiceId
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
app.get('/DescribeBankList', handleFun);
app.get('/DescribeToken', function(req, res){
	var path=req.path;
	var PsInfo=req.query.PsInfo;
	var BkCode=req.query.BkCode;
	var SprdId=req.querySprdId;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		var openid=redisStore.hget('SessionId_OpenId', session_id);
		var unionid=redisStore.hget('OpenId_UnionId', openid);
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type':'application/json'
			},
			body: {
				Action : path.substring(1, path.length),
				SessionId : session_id,
				UnionId : unionid,
				PsInfo : PsInfo,
				BkCode : BkCode,
				SprdId : SprdId
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
app.get('/VerifyMsgAndRegister', function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		var phoneNum=req.query.PhoneNum;
		var authCode=req.query.AuthCode;
		if(phoneNum && authCode){
			var myAuthCode=redisStore.get(phoneNum);
			if(myAuthCode===authCode){
				var openid=redisStore.hget('SessionId_OpenId', session_id);
				var unionid=redisStore.hget('OpenId_UnionId', openid);
				request({
					url: config.serverAddress,
					method: 'POST',
					json: true,
					headers: {
						'Content-Type':'application/json'
					},
					body: {
						Action : 'VerifyWhiteList',
						phoneNum: phoneNum,
						openId: openid,
						unionId: unionid
					}
				}, function(err, response, body){
					if(!err && response.statusCode==200){
						var json=JSON.parse(body);
						var isInWhiteList=json.isInWhiteList;
						if(isInWhiteList==='yes'){
							res.json({Msg: 'successful', Code: 0});
						}else{
							res.json({Msg: 'The phone number is not in white list', Code: 8005});
						}
					}else{
						res.json({Msg: err, Code:9001});
						console.log('error:'+err);
					}
				});
			}else{
				res.json({Msg: 'The short message is invalid', Code: 8004});
				console.log('The short message is invalid, errorCode: 8004');
			}
		}else{
			res.json({Msg: 'The phone number or authcode is null', Code: 8003});
			console.log('The phone number or authcode is null, errorCode: 8003');
		}
	}else{
		res.json({Msg: 'sessionid is invalid', Code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
});
var hadOpenId=function(openid, req, res){
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
					Action : 'ModifyPhoneNum',
					phoneNum: phoneNum,
					openId: openid,
					unionId: unionid
				}
			}, function(err, response, body){
				if(!err && response.statusCode==200){
					var json=JSON.parse(body);
					var isSuccessful=json.isSuccessful;
					if(isSuccessful==='yes'){
						res.json({Msg: 'successful', Code: 0});
					}else{
						res.json({Msg: 'The phone number is not in white list', Code: 8005});
					}
				}else{
					res.json({Msg: err, Code:9001});
					console.log('error:'+err);
				}
			});
		}else{
			res.json({Msg: '/hadOpenId: The error is unknow',Code:9001});
			console.log(err);

		}
	});
}
var hadMyAuthCode=function(authCode, myAuthCode, req, res){
	if(authCode===myAuthCode){
		var SessionId=req.query.SessionId;
		redisStore.hget('SessionId_OpenId', SessionId, function(err, openid){
			if(!err){
				hadOpenId(openid, req, res);
			}else{
				res.json({Msg: '/hadMyAuthCode: The error is unknow',Code:9001});
				console.log(err);
			}
		});
	}else{
		res.json({Msg: 'The short message is invalid', Code: 8004});
		console.log('The short message is invalid, errorCode: 8004');
	}
};
app.get('/VerifyMsgAndModifyPhoneNum', function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){
		var phoneNum=req.query.PhoneNum;
		var authCode=req.query.AuthCode;
		if(phoneNum && authCode){
			redisStore.get(phoneNum, function(err, myAuthCode){
				if(!err){
					hadMyAuthCode(authCode, myAuthCode, req, res);
				}else{
					res.json({Msg: '/VerifyMsgAndModifyPhoneNum: The error is unknow',Code:9001});
					console.log(err);
				}
			});
		}else{
			res.json({Msg: 'The phone number or authcode is null', Code: 8003});
			console.log('The phone number or authcode is null, errorCode: 8003');
		}


		if(phoneNum && authCode){
			redisStore.get(phoneNum, function(err, myAuthCode){
				if(myAuthCode===authCode){
					var openid=redisStore.hget('SessionId_OpenId', session_id);
					var unionid=redisStore.hget('OpenId_UnionId', openid);
				}else{
				}
			});
		}else{
			res.json({Msg: 'The phone number or authcode is null', Code: 8003});
			console.log('The phone number or authcode is null, errorCode: 8003');
		}
	}else{
		res.json({Msg: 'sessionid is invalid', Code: 8002});
		console.log('sessionid is invalid, errorCode: 8002');
	}
});
app.get('/VerifyInvitationCode', function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){

	}
});
app.get('/GetCaptchaPng', function(req, res){
	var code=parseInt(Math.random()*9000+1000);
	var p=new captchapng(100, 30, code);
	p.color(0, 0, 0, 0);
	p.color(80, 80, 80, 255);
	var img = p.getBase64();
	var imgbase64 = new Buffer(img, 'base64');
	res.writeHead(200, {'Content-Type': 'image/png'});
	res.end(imgbase64);
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
