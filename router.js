'use strict';
const express = require('express');
const userController = require('./controllers/userController');
const musicController = require('./controllers/musicController');
//操作路由
let router = express.Router();
//路由规则开始
router.get('/register', userController.showRegister) //显示注册
    .post('/check-user-name', userController.checkUserName) //检查用户名是否存在
    .post('/doRegister', userController.doRegister) //处理注册
    .get('/login', userController.showLogin) //显示登录页面
    .get('/', userController.showIndex) //显示登录页面
    .post('/do-login', userController.doLogin) //处理登录
    .get('/index', userController.showIndex) //显示首页
    .get('/logout', userController.logout) //退出
    .post('/uploadMusic', musicController.insertMusic)
    .post('/updateMusic', musicController.updateMusic)
    .post('/deleteMusic', musicController.deleteMusic)
    .get('/getCaptchaPng', userController.getCaptchaPng);//获取验证码并加答案挂载到session上
    //路由规则结束

module.exports = router;
