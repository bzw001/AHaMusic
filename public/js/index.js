var lrcObj = {};
//解析歌词文件封装对象
function parseLrc(txt) {
    var obj = {};
    //以换行符切割内容
    var lines = txt.split('\n');
    console.log(lines);
    //遍历每一行 [00:03.62] 我的滑板鞋
    //正则/\[(\d{2})\:(\d{2})\.(\d{2})\].*/
    var regex = /\[(\d{2})\:(\d{2})\.(\d{2})\](.*)/;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]; //拿到每一行数据
        //正则匹配
        var result = regex.exec(line); //返回结果数组
        if(!result) continue;
        console.log(result);
        var m = result[1]; //分钟
        var s = result[2] - 0; //秒钟
        var ms = result[3] - 0; //毫秒
        var content = result[4];
        // var time = (s * 1000) + (m * 60 * 1000) + ms; //由于audio标签播放是按秒为单位，太精确无法匹配上，所以就用秒来匹配
        // var time = s + (m * 60);
        //
        // 按照四舍五入的方式
        var time = s + (m * 60) + (ms / 100);
        time = Math.round(time);
        obj[time] = content;
    }
    return obj;
}
//创建对应的一堆p标签
function createUI(obj) {
    var htmlText = '';
    //遍历有多少key
    for (var key in obj) { //obj[key]是内容
        htmlText += '<p time=' + key + '>' + obj[key] + '</p>'
    }
    $('#lrc').html(htmlText); //将歌词内容放入到div中
}
//时间改变发生滚动效果
function scroll(time) {
    var currentTime = Math.round(time); //获取到四舍五入的时间  27
    //判断当前歌词对象的key是否有该时间
    if (typeof lrcObj[currentTime] === 'undefined') return;

    //走到这里证明时间是匹配的
    var $p = $('#lrc').find('p[time=' + currentTime + ']');
    //查找#LRC元素下面的p标签并且属性要time等于currentTime的元素

    //1:获取p标签的高度
    //2：和lrc元素进行高度的减法运算获取查

    var jumpPoint = $p.offset().top - $('#lrc').offset().top - parseInt($('#lrc').css('padding-top'));
    //移除原来的样式，添加新的样式
    $p.addClass('gl').siblings().removeClass('gl');
    //3:让lrc动一下
    $('#lrc').animate({
        'top': -jumpPoint
    }, 'slow');
}

$('.ply').on('click', function() {
    var src = $(this).attr('data-src'); //获取你点击的这个元素的src属性
    //把这个src赋值给音乐播放元素的src
    var imgsrc=$(this).attr('data-imgsrc');
    var lrc=$(this).attr('data-lrc');
    console.log(src);
    $('#audio').attr('src', src);
    $('#singerImag').attr('src', imgsrc);

    //根据ajax发起请求，获取歌词内容数据
    $.ajax({
        url: '/public/musics/lrcs/'+lrc,
        type: 'get',
        success: function(data) { //返回的就是文件的内容不要转换成对象
            console.log(data);
            lrcObj = parseLrc(data);

            //测试音乐播放的事件
            $('#audio').on('playing', function() {
                if (this.currentTime === 0) createUI(lrcObj);
            });
            //注册播放事件更改事件
            $('#audio').on('timeupdate', function() {
                scroll(this.currentTime);
            });
        }
    });
})
