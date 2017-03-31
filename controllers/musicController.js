'use strict';

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/AHAMusic';
const fs=require('fs');
const formidable=require('formidable');
const querystring=require('querystring');
const path=require('path');
const http = require('http');
const ObjectID=require('mongodb').ObjectID;
const appConfig=require('../config');


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


/*获取歌词*/
exports.getLrcAndInsert=function(songname,singer,obj,req,res,next){
    let lrcname=songname+'-'+singer+'.txt';
    let singerImgSrc='';
    let songlrcSrc='';
    let songAPISrc='http://tingapi.ting.baidu.com/v1/restserver/ting?from=android&version=4.9.2.0&method=baidu.ting.search.merge&format=json&query='+encodeURI(songname.trim());
    //console.log(songAPISrc);
    http.get(songAPISrc, function(response){
        response.setEncoding("utf-8");
        var resData ='';
        response.on("data", function(data){
            //resData.push(chunk);
            resData+=data;
        })
            .on("end", function(){
                //console.log(resData.join(""));
                resData=JSON.parse(decodeURI(resData));
                if(resData.error_code===22000){
                    if(resData.result.album_info.album_list){
                        singerImgSrc=resData.result.album_info.album_list[0].pic_small;
                    }
                    //console.log(singerImgSrc);
                    var songlistLrc=resData.result.song_info.song_list;
                    if(songlistLrc){

                        songlistLrc.every(function(song){
                            if(song.title.trim()===songname.trim()){
                                songlrcSrc=song.lrclink;
                            }else return true;
                        });
                        //songlrcSrc=resData.result.song_info.song_list[0].lrclink;

                        /*插入数据库*/
                        MongoClient.connect(url, function(err, db) {
                            if (err) {
                                err.lineNum=__filename+":"+__line;

                                return next(err);
                            }
                            let userCollection = db.collection('musicList');
                                userCollection.insertMany([{
                                    title:obj.title,
                                    singer:obj.singer,
                                    uid:obj.uid,
                                    musicSrc:obj.musicSrc,
                                    lrc:lrcname,
                                    imgSrc:singerImgSrc
                                }], function(err, result) {
                                    if (err) {
                                        err.lineNum=__filename+":"+__line;
                                        next(err);
                                    }
                                    if (result.insertedCount === 1) {
                                        res.json({ code: '200', msg: '插入数据库成功' })
                                    }
                                    db.close(); //关闭连接
                                });

                        });


                    }


                    if(songlrcSrc){
                        http.get(songlrcSrc, function(res){
                            res.setEncoding("utf-8");
                            var resData ='';
                            res.on("data", function(data){
                                //resData.push(chunk);
                                resData+=data;
                            })
                                .on("end", function(){
                                    //console.log(resData.join(""));
                                    //console.log(resData);
                                    fs.writeFile('./public/musics/lrcs/'+lrcname,resData,function(err){
                                        if(err){
                                            throw err;
                                        }
                                    })
                                });
                        });
                    }
                }
            });
    });

};


exports.insertMusic=function(req,res,next){
    let uid=req.session.user._id;
    if(!uid){
        res.json({code:'003',msg:'no session user _id'});
    }
    var form=new formidable.IncomingForm();
    form.uploadDir='D:/trainCourse/projectsOfWebstorm/201703/music/public/musics/MP3';

    form.parse(req,function(err,fields,files){  //fields是得到的所有数据，是一个对象
        const musicInfo=querystring.parse(fields.data);

        let  filePath='/public/musics/MP3/'+path.parse(files.file.path).base;

        let obj={
            title:musicInfo.title,
            singer:musicInfo.singer,
            uid:uid,
            musicSrc:filePath
        };
        exports.getLrcAndInsert(musicInfo.title,musicInfo.singer,obj,req,res,next)
    });
};

exports.updateMusic=function(req,res,next){
    let title=req.body.title;
    let singer=req.body.singer;
    let music_id=req.body.music_id;
    let uid=req.session.user._id;

    let _id;

    console.log(typeof music_id);
    _id=ObjectID&&ObjectID(music_id);
    if(!uid){
        res.json({code:'003',msg:'no session user _id'});
    }
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('wrong line:'+__currentFileName+":"+__line);
            return next(err);
        }
        let musicCollection = db.collection('musicList');
        musicCollection.update({_id},{$set:{title:title,singer:singer}}, function(err, result) {
            if (err) next(err);
            if(result.result.nModified===1){
                res.json({ code: '200', msg: '插入数据库成功' });
            }else{
                res.json({ code: '003', msg: '插入数据未成功' });
            }

            db.close(); //关闭连接
        });
    });
};

exports.deleteMusic=function(req,res,next){
    let music_id=req.body.music_id;
    let _id=ObjectID&&ObjectID(music_id);
    let uid=req.session.user._id;
    if(!uid){
        res.json({code:'003',msg:'no session user _id'});
    }

    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('wrong line:'+__currentFileName+":"+__line);
            return next(err);
        }
        let musicCollection = db.collection('musicList');
        musicCollection.find({_id}).toArray(function(err,music){
            if(err) {
                console.log(__currentFileName + ':' + __line);
                next(err);
            }
            let musicSrc=music[0].musicSrc;
            musicCollection.deleteOne({_id}, function(err, result) {
                if (err) next(err);
                if(result.result.n===1){
                    //删除音乐文件
                    fs.unlink(appConfig.appRootPath+musicSrc,function(err){
                        if(err) {
                            next(err);
                        }
                        console.log('音乐文件删除成功')
                    });
                    res.json({ code: '200', msg: '删除数据成功' });
                }else{
                    res.json({ code: '004', msg: '删除数据失败' });
                }
                db.close(); //关闭连接
            });
        });

    });

};