var request=require('request');
var fs=require('fs');
var multiparty=require('multiparty');
var config=require('./config');
var redisStore=require('./redisStore');
var opts={uploadDir: './upload'};
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
					}else{
						console.log('/upload:rename file error');
					}
				});
				res.json({Msg: 'successful', Code: 0});
			});
		}else{
			res.json({Msg: 'sessionid is invalid', Code: 8002});
			console.log('sessionid is invalid, errorCode: 8002');
		}
	});	
}
module.exports=uploadFile;
