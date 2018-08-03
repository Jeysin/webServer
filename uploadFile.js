var request=require('request');
var fs=require('fs');
var multiparty=require('multiparty');
var config=require('./config');
var redisStore=require('./redisStore');
var opts={uploadDir: config.uploadDir};

var hadOpenId=function(openid, fileName, res){
	redisStore.hget('OpenId_UnionId', openid, function(err, unionid){
		if(err){
			res.json({Msg: 'hadOpenId:redisStore.hget: unknow error', Code: 9001});
			return;
		}
		request({
			url: config.serverAddress,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type':'application/json'
			},
			body: {
				Action : 'UploadFile',
				fileName: fileName,
				openId: openid,
				unionId: unionid
			}
		}, function(err, response, body){
			if(!err && response.statusCode==200){
				if(body.isSuccessful==='yes'){
					res.json({Msg: 'upload file successful', Code: 0});
					console.log('upload file successful');
				}else{
					res.json({Msg: 'upload file failure', Code: 8500});
					console.log('upload file failure');
				}
			}else{
				res.json({Msg: 'unknow error:request server UploadFile', Code:9001});
				console.log('unknow error:request server UploadFile, error:'+err);
			}
		});
	});
}
var uploadFileCore=function(fileName, SessionId, res){
	redisStore.hget('SessionId_OpenId', SessionId, function(err, openid){
		if(err){
			res.json({Msg: 'redisStore.hget: unknow error', Code: 9001});
			return;
		}
		hadOpenId(openid, fileName, res);
	});
}
var uploadFile=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_id=req.query.SessionId;
	if(!session_id){
		res.json({Msg: 'SessionId can not be null', Code: 8003});
		console.log('Msg: SessionId can not be null, Code: 8003');
		return;
	}
	redisStore.ttl(session_id, function(err, expireTime){
		if(err){
			res.json({Msg: '/sendShortMsg: The error is unknow',Code:9001});
			console.log(err);
			return;
		}
		if(expireTime>0){
			var form=new multiparty.Form(opts);
			form.parse(req, function(err, fields, files){
				var oldName=files.file[0].path;
				var newName=opts.uploadDir+'/'+files.file[0].originalFilename;
				fs.rename(oldName, newName, function(err){
					if(!err){
						console.log('add file:'+newName);
						uploadFileCore(files.file[0].originalFilename, session_id, res);
					}else{
						console.log('/uploadFile:fs.rename: error');
						res.json({Msg:'/uploadFile:fs.rename: The error is unknow',Code:9001});
					}
				});
			});
		}else{
			res.json({Msg: 'sessionid is invalid', Code: 8002});
			console.log('sessionid is invalid, errorCode: 8002');
		}
	});	
}
module.exports=uploadFile;
