/**
 * Created by Administrator on 2016-02-17.
 */


var articleDao = require("./../../../dao/article");
var stringHelper = require("./../../../helper/stringHelper");
var dateHelper = require("./../../../helper/dateHelper");
var robotHelper = require("./../../../helper/robotHelper");
var path = require('path');

var controller = {};

//文章后台首页
controller.index = function(req,res) {
    res.render("articleIndex");
}


controller.operate = function(req,res) {
    var param = {};
    var operate = req.query.operate;
    if(operate == "create") {
        param.data = null;
        param.operate = "create";
        param.forumId = req.query.forumId;
        res.render("articleOperate",param);
    } else if(operate == "edit") {
        var _id = req.query._id;
        articleDao.base.getById(_id,function(err,data) {
            param.data = data;
            param.operate = "edit";
            res.render("articleOperate",param);
        });
    }
}


//集合
controller.list = function(req,res) {
    var page = parseInt(req.body.page);
    var size = parseInt(req.body.rows);
    var keywords = req.body.keywords;
    var forumId = req.body.forumId;
    var where = {};
    if (keywords) {
        var pattern = new RegExp("^.*"+keywords+".*$");
        where.title = pattern;
    }
    if(forumId) {
        where.forumId = forumId
    } else {
        res.send("");
        return;
    }

    articleDao.base.getList(page,size,where,function(status,data) {
        res.send(status?data:"");
    })
};

var http = require("http");
var cheerio  = require("cheerio");
var async  = require("async");
controller.spider = function(req,res) {
    var keywords = decodeURI(req.query.keywords);
    var forumId = req.query.forumId;
    var page = req.body.page;
    var url = "http://zzk.cnblogs.com/s?t=b&w="+keywords+"&p="+page;
    async.waterfall([
        function(callback) {
            var data = "";
            var req = http.request(url, function(res){
                res.setEncoding("utf8");
                res.on('data', function(chunk){
                    data += chunk;
                });
                res.on('end', function(){
                    callback(null,data);
                });
            });
            req.on('error', function(e){
                throw e;
            });
            req.end();
        },
        function(arg,callback) {
            var $ = cheerio.load(arg,{decodeEntities: false});
            var hasNext = $("#paging_block .pager a").filter(function(i,e) {
                if(new RegExp("next","i").test($(e).text())) {
                    return $(e);
                }
            })

            var p = $("#paging_block .pager a").last().prev().text();
            if(hasNext.length == 0) {
                p = $("#paging_block .pager a").last().text();
            }

            //文章
            var articleList = [];
            $("#main").find('.searchItem').each(function(i,e) {
                var articleInfo = {};
                articleInfo.id = parseInt(page+i);
                articleInfo.forumId = forumId;
                articleInfo.title = $(e).find(".searchItemTitle a").text();
                articleInfo.content = $(e).find(".searchCon").text().replace(/(^\s*)|(\s*$)/g, "");
                articleInfo.author = $(e).find(".searchItemInfo-userName a").text();
                articleInfo.redirectUrl = $(e).find(".searchItemTitle a").attr("href");
                articleInfo.createDate = Date.now();
                articleList.push(articleInfo);
            });
            var result = {rows:articleList,total:parseInt(p) * 20};
            callback(null,result);
        }
    ],function(err,results) {
        res.send(results);
    });
}



controller.submitSpider = function(req,res) {
    var arrayJson = req.body.articleList;
    var articleList = JSON.parse(arrayJson);
    var robot = new robotHelper(articleList,function() {
        res.send("success");
    });
    robot.crawler();
}



//添加
controller.create = function(req,res) {
    var title = req.body.title;
    if(title) {
        var model = {};
        model.title = title;
        model.forumId = req.body.forumId;
        model.tag = req.body.tag?req.body.tag.split(","):"";
        model.content = req.body.content;
        model.createDate= Date.now();
        model.readCount = 0;
        model.author = req.session.adminName;
        articleDao.base.create(model,function(status,data) {
            res.send(status?"success":data);
        });
    } else {
        res.send("error");
    }
};

//修改
controller.edit = function(req,res) {
    var _id = req.body._id;
    if(_id) {
        var model = {};
        model.title = req.body.title;
        model.forumId = req.body.forumId;
        model.tag = req.body.tag?req.body.tag.split(","):"";
        model.content = req.body.content;
        articleDao.base.update({_id:_id},model,{multi:false},function(data) {
            res.send(data===null?"success":data);
        })
    } else {
        res.send("error");
    }
};


//删除
controller.remove = function(req,res) {
    var _id = req.body._id;
    if(_id) {
        articleDao.base.remove({_id:_id},function(data) {
            res.send(data===null?"success":data);
        })
    }
};

//查找
controller.getTag = function(req,res) {
    articleDao.base.getByQuery({},{_id:0,tag:1},{multi:true},function(err,result) {
        res.send(err?"error":result);
    })
};


//上传
var fs = require("fs");
controller.uploadImg = function(req,res) {
    try {
        var extName = '';  //后缀名
        switch (req.files.myfile.type) {
            case 'image/pjpeg':extName = 'jpg';break;
            case 'image/jpeg':extName = 'jpg';break;
            case 'image/png':extName = 'png';break;
            case 'image/x-png':extName = 'png';break;
        }
        var avatarName = Date.now() + '.' + extName;
        var uploadFolder = "/upload/";
        var newPath = "public/" + uploadFolder + avatarName;
        fs.createReadStream(req.files.myfile.path).pipe(fs.createWriteStream(newPath));
        var showFolder = uploadFolder+avatarName;
        res.send(showFolder);
    }catch(e) {
        console.log(e);
    }
};




module.exports = controller;