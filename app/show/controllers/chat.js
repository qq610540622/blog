
var controller = {};
controller.index = function(req,res) {
    var userModel = req.session.userModel;
    if(userModel) {
        res.render("chat",{title:"聊天室",userModel:userModel});
    } else {
        res.render("error")
    }
};

module.exports = controller;
