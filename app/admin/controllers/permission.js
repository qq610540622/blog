/**
 * Created by Administrator on 2016-03-18.
 */

var permissionDao = require("./../../../dao/permission");

var controller = {};

/**
 * 权限首页
 * @param req
 * @param res
 */
controller.index = function(req,res) {
    res.render("permissionIndex");
}


/**
 * 获取集合
 * @param req
 * @param res
 */
controller.getList = function(req,res) {
    permissionDao.base.getList(function(err,result) {
        if(err) res.send("error");
        else {
            res.json(result);
        }
    })
}


/**
 * 权限操作(添加和修改)
 * @param req
 * @param res
 */
controller.permissionOperate = function(req,res) {
    var operate = req.query.operate;
    if(operate == "create") {
        var data = {operate:"create",model:null};
        res.render("permissionOperate",data);
    } else if(operate == "edit") {
        var _id = req.query._id;
        if(_id) {
            permissionDao.base.getSingleByQuery({_id:_id},function(err,result) {
                if(err) res.render("error");
                else {
                    var data = {operate:"edit",model:result};
                    res.render("permissionOperate",data);
                }
            });
        }
    }
}


/**
 * 创建
 * @param req
 * @param res
 */
controller.create = function(req,res) {
    var permissionName = req.body.permissionName;
    var permissionCode = req.body.permissionCode;
    console.log(permissionName)
    console.log(permissionCode)
    if(permissionName && permissionCode) {
        var model = {permissionName:permissionName,permissionCode:permissionCode};
        permissionDao.base.create(model,function(err,result) {
            res.send(err ? "error" : "success");
        });
    } else {
        res.send("error");
    }
}


/**
 * 修改
 * @param req
 * @param res
 */
controller.edit = function(req,res) {
    var _id = req.body._id;
    var permissionName = req.body.permissionName;
    var permissionCode = req.body.permissionCode;
    if(_id && permissionName && permissionCode) {
        permissionDao.base.update({_id:_id},{$set:{permissionName:permissionName,permissionCode:permissionCode}},{multi:false,upset:false},function(err) {
            res.send(err ? "error" : "success");
        });
    } else {
        res.send("error");
    }
}


/**
 * 删除
 * @param req
 * @param res
 */
controller.remove = function(req,res) {
    var ids_str = req.body.ids_str;
    if(ids_str) {
        var _ids = JSON.parse(ids_str);
        if(_ids) {
            permissionDao.base.remove({_id:{$in:_ids}},function(err) {
                res.send(err ? "error" : "success");
            });
        } else {
            res.send("error");
        }
    }
}


module.exports = controller;

