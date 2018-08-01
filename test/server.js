var express=require('express');
var request=require('request');
var querystring=require('querystring');
var bodyParser=require('body-parser');
var config=require('./config');
var fs=require('fs');
var http=require('http');
var https=require('https');
var app=express();

//读取https证书
var privateKey=fs.readFileSync('../../https/Apache/3_openbank.qcloud.com.key', 'utf8');
var certificate=fs.readFileSync('../../https/Apache/2_openbank.qcloud.com.crt', 'utf8');
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
//var multer  = require('multer');
//var upload = multer({ dest: 'upload/'});
//
//var type = upload.single('recfile');
//app.post('/upload', type, function (req,res) {
//	var tmp_path = req.file.path;
//	console.log('tmp_path');
//	var target_path = 'upload/' + req.file.originalname;
//	var src = fs.createReadStream(tmp_path);
//	var dest = fs.createWriteStream(target_path);
//	src.pipe(dest);
//	src.on('end', function() { res.render('complete'); });
//	src.on('error', function(err) { res.render('error'); });
//});

//var multipart=require('connect-multiparty');
//app.use(multipart({uploadDir:'./upload'}));
//var multipartMiddleware=multipart();
//app.post('/upload', multipartMiddleware, function(req, res){
//	console.log(req.body);
//	console.log('*******************');
//	console.log(req.files);
//	console.log('*******************');
//	console.log(req.file);
//	console.log('*******************');
//	res.json({Msg: 'successful'});
//});

var multiparty=require('multiparty');
var opts={uploadDir: './upload'};
app.post('/upload', function(req, res){
	var form=new multiparty.Form(opts);
	form.parse(req, function(err, fields, files){
		var oldName=files.null[0].path;
		var newName=opts.uploadDir+'/'+files.null[0].originalFilename;
		fs.rename(oldName, newName, function(err){
			if(!err){
				console.log('add file:'+newName);
			}else{
				console.log('/upload:rename file error');
			}
		});
		res.json({Msg: 'successful'});
	});
});
