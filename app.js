'use strict';
const express = require('express');
const template = require('art-template');
const bodyParser = require('body-parser');
const router = require('./router.js');
const session = require('express-session'); //处理session
const cookieParser = require('cookie-parser'); //解析cookie
let app = express();
//配置渲染模板
template.config('cache', false);
app.set('views', './views');
app.engine('html', template.__express);
app.set('view engine', 'html');
//模板结束


//解析body数据
app.use(bodyParser.urlencoded({ extended: false }));
//处理静态资源文件
app.use('/public', express.static('public'));

//添加session的处理
app.use(session({
    secret: 'tobone', //唯一标识一下
    resave: false, //当某个用户的session没有发生改变，不用再次重复保存
    saveUninitialized: true //一访问就存在session
    // cookie: { secure: true }  设置cookie只在https中有效
}));
//放在路由的前面，提前让req具备解析cookie的属性
app.use(cookieParser());
app.use(router);


//限制url路径
app.use(function(req,res,next){
    let urlArr=['/','/login','/index'];
    console.log(req.url);
    if(urlArr.indexOf(req.url)===-1){
        res.redirect('/login');
    }
    next();
});
//处理异常
app.use(function(req, res,err, next) {
    console.log(':服务器异常,', err.stack);//err.stack
    next();
});
app.listen(80, () => {
    console.log('服务器运行中');
});

/*定义行号*/
Object.defineProperty(global,"__line",{
    get:function(){
        var oldLimet=Error.stackTraceLimit;
        Error.stackTraceLimit=2;//只要2最顶部的两个栈的内容就够了
        var error = new Error();
        Error.stackTraceLimit.oldLimet;
        var callStack= error.stack.split("\n")[2];
        var list = callStack.split(":");
        return list[list.length-2]-0;//从字符串中匹配出行号信息,并把它转化成整数
    }
});

/*显示当前文件名*/

Object.defineProperty(global,"__currentFileName",{
    get:function(){
        let index=__filename.lastIndexOf('\\');
        return __filename.slice(index+1);
    }
});

console.log(__currentFileName);