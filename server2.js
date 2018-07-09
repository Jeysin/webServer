const express=require('express');
const request=require('request');
const redis=require('redis');
const crypto=require('crypto');
const bodyParser=require('body-parser');

var app=express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/onLogin2', function(req, res){
	let code=req.query.js_code;
	let appid=req.query.appid;
	let secret=req.query.secret;
	console.log('onLogin2: code is:'+code);
	console.log('onLogin2: appid is:'+appid);
	console.log('onLogin2: secret is:'+secret);
	res.set('Content-Type', 'application/json');
	res.json({openid:'abcdefg', session_key:'ABCDEFG'});
});
var server=app.listen(8889, function(){
	var host=server.address().address;
	var port=server.address().port;
	console.log('address is http://%s:%s', host, port);
});
