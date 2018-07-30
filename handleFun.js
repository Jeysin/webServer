var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
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
	var session_id=req.query.SessionId;
	redisStore.ttl(session_id, function(err, expireTime){
		if(expireTime>0){
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
	});
}
module.exports=handleFun;
