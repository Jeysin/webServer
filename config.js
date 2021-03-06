var config={
	httpPort:80,
	httpsPort:443,
	//httpPort:10002,
	//httpsPort:10001,
	//redis配置
	redisPort:6379,
	redisHost:'127.0.0.1',
	redisPasswd:'123456',
	//微信小程序配置
	//appid:'wx9d86fb50c899df5a',
	//secret:'1dc57f86cd8a80d3b592d5630513d8f8',
	appid:'wxd4efb4246f27446d',
	secret:'47c67dcbf238783e33e4b40512802076',
	wxAddress:'https://api.weixin.qq.com/sns/jscode2session',
	//获取微信access_token的接口地址
	accessTokenUrl:'https://api.weixin.qq.com/cgi-bin/token',
	//获取微信图片二维码A接口地址
	imageCodeUrlA:'https://api.weixin.qq.com/wxa/getwxacode',
	//获取微信图片二维码B接口地址
	imageCodeUrlB:'https://api.weixin.qq.com/wxa/getwxacodeunlimit',
	//后台配置
	serverAddress:'http://193.112.75.25:10003/product',
	//上传文件路径配置
	uploadDir:'../cfs/upload',
	//log文件配置
	logDirName: 'log',
	logFileName:'webServer.log'
}
module.exports=config;
