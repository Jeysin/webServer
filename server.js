var express=require('express');
var request=require('request');
var bodyParser=require('body-parser');
var fs=require('fs');
var http=require('http');
var https=require('https');
var app=express();
var morgan=require('morgan');
var fs=require('fs');
var config=require('./config');

//读取https证书
var privateKey=fs.readFileSync('../https/Apache/3_openbank.qcloud.com.key', 'utf8');
var certificate=fs.readFileSync('../https/Apache/2_openbank.qcloud.com.crt', 'utf8');
var credentials={key: privateKey, cert: certificate};
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
var onLogin=require('./onLogin');
var handleFun=require('./handleFun');
var describeToken=require('./describeToken');
var sendShortMsg=require('./sendShortMsg');
var getCaptchaPng=require('./getCaptchaPng');
var verifyMsgAndRegister=require('./verifyMsgAndRegister');
var verifyMsgAndModifyPhoneNum=require('./verifyMsgAndModifyPhoneNum');
var verifyInvitationCode=require('./verifyInvitationCode');
var getBaseInfo=require('./getBaseInfo');

app.get('/onLogin', onLogin);
app.get('/DescribeDepositProducts', handleFun);
app.get('/DescribeFinanceProducts', handleFun);
app.get('/DescribeLoanProducts', handleFun);
app.get('/DescribeBankList', handleFun);
app.get('/DescribeToken', describeToken);
app.get('/SendShortMsg', sendShortMsg);
app.get('/VerifyMsgAndRegister', verifyMsgAndRegister);
app.get('/VerifyMsgAndModifyPhoneNum', verifyMsgAndModifyPhoneNum);
app.get('/VerifyInvitationCode', verifyInvitationCode);
app.get('/GetBaseInfo', getBaseInfo);
app.get('/GetCaptchaPng', getCaptchaPng);
app.get('/DescribeServices', handleFun);
