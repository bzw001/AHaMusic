
/*获取歌词测试*/
var fs=require('fs');
var http = require('http');
var strUrl = "http://musicdata.baidu.com/data2/lrc/0575b1ed05d5b0028793d38dd605db83/300877887/300877887.lrc";
http.get(strUrl, function(res){
    res.setEncoding("utf-8");
    var resData ='';
    res.on("data", function(data){
        //resData.push(chunk);
        resData+=data;
    })
        .on("end", function(){
            //console.log(resData.join(""));
            console.log(resData);
            fs.writeFile('./musics/lrcs/成都-赵雷.txt',resData,function(err){
                if(err){
                    throw err;
                }
            })
        });
});