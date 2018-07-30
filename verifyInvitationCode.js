var request=require('request');
var config=require('./config');
var redisStore=require('./redisStore');
var verifyInvitationCode=function(req, res){
	var path=req.path;
	console.log('Request path:'+path);
	var session_val='';
	var session_id=req.query.SessionId;
	if(session_id)session_val=redisStore.get(session_id);
	if(session_val){

	}
}
module.exports=verifyInvitationCode;
