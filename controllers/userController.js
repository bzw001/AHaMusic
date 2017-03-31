'use strict';

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/AHAMusic';
const fs=require('fs');
const captchapng = require('captchapng');



exports.findUser = (obj, callback) => {
        MongoClient.connect(url, function(err, db) {
            console.log('数据库连接成功');
            //获取集合对象
            let userCollection = db.collection('users');
            userCollection.find(obj).toArray(function(err, users) {
                db.close(); //关闭连接
                callback(err, users); //我不去处理异常了，由;外部来处理
            });

        });
    };
exports.findMusicList = (obj, callback) => {
    MongoClient.connect(url, function(err, db) {
        console.log('数据库连接成功');
        //获取集合对象
        let userCollection = db.collection('musicList');
        userCollection.find(obj).toArray(function(err, musicList) {
            db.close(); //关闭连接
            callback(err, musicList); //我不去处理异常了，由;外部来处理
        });

    });
};

    // let obj = {
    //     showRegister
    // }

// module.exports = obj

//module.exports默认是导出一个空对象，如果你赋值，也是拿到的module.exports这个对象
exports.showRegister = function(req, res, next) {
    //接受数据
    let name = req.query.name; // /register?name=jack
    //操作数据
    //使用name作为条件查询数据
    exports.findUser({ name }, function(err, users) {
        if (err) {
            err.lineNum=__filename+":"+__line;
            next(err);
        }
        res.render('register')
    });
};
exports.checkUserName = (req, res, next) => {
    let username = req.body.username;

    exports.findUser({ username }, function(err, users) {
        if (err){
            err.lineNum=__filename+":"+__line;
            return next(err);
        }
        if (users.length != 0) {
            res.json({ code: '001', msg: '用户名已经存在!' });
        } else {
            res.json({ code: '002', msg: '恭喜可以注册!' });
        }
    });

};

/**
 * 处理注册
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.doRegister = (req, res, next) => {
    //获取请求数据post
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let vcode = req.body.vcode;

    //获取vcode
    let sessionVcode = req.session.vcode;
    //if (vcode != sessionVcode) {
    //    return res.json({ code: '003', msg: '验证码错误！' });
    //}

    //判断vcode ，技术有限，先缓缓

    //判断用户名是否存在
    MongoClient.connect(url, function(err, db) {
        if (err) {
            err.lineNum=__filename+":"+__line;
            return next(err);
        }
        let userCollection = db.collection('users');
        userCollection.find({ username }).toArray(function(err, users) {
            if (err){
                err.lineNum=__filename+":"+__line;
                return next(err);
            }
            if (users.length != 0) {
                db.close();
                return res.json({ code: '002', msg: '用户名已经存在' });
            }
            //没有该用户，保存该用户数据
            userCollection.insertMany([{
                username,
                email,
                password
            }], function(err, result) {
                if (err) {
                    err.lineNum=__filename+":"+__line;
                    next(err);
                }
                if (result.insertedCount === 1) {
                    res.json({ code: '200', msg: '恭喜注册成功！' })
                }
                db.close(); //关闭连接
            });


        });

    });
};
/**
 * 处理显示登录页面
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.showLogin = (req, res, next) => {
        let username = '';
        let checked='';
        //原生操作cookie
        // if (typeof req.headers['cookie'] != 'undefined') {
        //     let qs = require('querystring');
        //     //connect.sid=s%3AKoY-YOMdmZvAxqX9gTxBe0SmgyxU2viS.2BWtra%2FNNvcZtBhLjTxDfoLymfVqGOAgBV3lZjtNsGo; username=guangzhou5qi
        //     username = qs.parse(req.headers['cookie']).username;
        // }
        // 使用cookie-parser
        if (typeof req.cookies.username != 'undefined') {
            username = req.cookies.username;
            checked='checked';
        }
    console.log("username: "+username);
    res.render('login', { username:username ,checked:checked });
    }
    /**
     * 处理登录
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
exports.doLogin = (req, res, next) => {
    //1：接受参数post
    let username = req.body.username;
    let password = req.body.password;
    let rememberme = req.body.rememberme; //这个值有可能是undefined
    let vcode=req.body.vcode;

    console.log(username);
    let sessionVcode = req.session.vcode;
    if (vcode != sessionVcode) {
        return res.render('login',{ code: '003', msg: '验证码错误！' });
    }
    //2: 通过username查询数据库，判断该用户是否存在
    exports.findUser({ username }, function(err, users) {
        if (err) {
            err.lineNum=__filename+":"+__line;
            next(err);
        }
        console.log(users);

        if (users.length === 0) { //用户名不存在
            return res.render('login', { msg: '用户名不存在' });
            //return res.json({code:'001',mgs:'用户名不存在'});
        }
        let user = users[0]; //注册的口被我们阻塞了，不可能出现同一个用户名多个用户的情况,所以此时直接取第一个元素就ok

        //3: 如果用户名存在 比较密码
        if (password != user.password) {
            return res.render('login', { msg: '密码不正确' });
            //return res.json({code:'002',msg:'密码不正确'});
        }

        //根据用户是否勾选记住我，向服务器写cookie
        let time = 1000 * 60 * 60 * 24 * 7;
        if (typeof rememberme === 'undefined') {
            time = -1; //清除cookie
        }
        res.cookie('username', username, {
            maxAge: time //记住我一周
        });

        //如果可以登录，把数据放入到session中
        req.session.user = user;
        //如果以上反向判断都不满足。说明密码正确，跳转到首页
        res.redirect('/index');

    });


};
/**
 * 显示首页
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.showIndex = (req, res, next) => {
        //使用该用户当前的session
        let user = req.session.user;
        //强制需要登录才能进首页
        if(!user){
            res.redirect('/login');
        }
    //console.log('user'+user._id);
        let uid=user._id;
    if (!user) res.redirect('/login'); //如果直接访问，驱逐到登录页面
        exports.findMusicList({uid},function(err,musicList){
            if(err) {
                err.lineNum=__filename+":"+__line;
                next(err);
            }
           for(var key in musicList[0]){
               console.log(key+':'+musicList[0][key])
           }
            //这里的_id是数字，模板渲染不出来，需要转换成数字
            musicList.forEach(function(music){
                music._id=music._id+'';
            });
            res.render('index', {user:user,musicList:musicList});
        });
    };
    /**
     * 退出
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
exports.logout = (req, res, next) => {
        req.session.user = null; //清除session中的状态
        res.redirect('/login');
    }
    /**
     * 响应验证码并将答案挂载到session上
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
exports.getCaptchaPng = (req, res, next) => {
    var num = parseInt(Math.random() * 9000 + 1000);
    var p = new captchapng(80, 30, num); // width,height,numeric captcha 
    p.color(0, 0, 0, 0); // First color: background (red, green, blue, alpha) 
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha) 

    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    //挂载答案到session上
    req.session.vcode = num;

    // console.log(imgbase64);
    res.end(imgbase64);

}

exports.getCaptchaPng = (req, res, next) => {
    var num = parseInt(Math.random() * 9000 + 1000);
    var p = new captchapng(80, 30, num); // width,height,numeric captcha
    p.color(0, 0, 0, 0); // First color: background (red, green, blue, alpha)
    p.color(83, 80, 80, 255); // Second color: paint (red, green, blue, alpha)


    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    //挂载答案到session上
    req.session.vcode = num;

    // console.log(imgbase64);
    res.end(imgbase64);
}


