var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('./common/logger');
var config = require('./config');
var RedisStore = require('connect-redis')(session);
var app = express();

//视图引擎
app.set('views', ['./app/show/views/pages','./app/admin/views']);
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
app.enable('trust proxy');


//指定静态资源
app.use(express.static(path.join(__dirname, 'public')));

//http请求体中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));

//cookie,session中间件
app.use(cookieParser(config.session_secret));
app.use(session({
    secret: config.session_secret,
    store: new RedisStore({
        port: config.redis_port,
        host: config.redis_host,
    }),
    resave: true,
    saveUninitialized: true,
}));


//路由
var route = require('./routes/index');
var cache = require('./common/cache');
new route(app);

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.on('connection', function(socket){
    socket.on('login', function(obj){
        console.log("login");
        var result = {};
        socket.name = obj.userid;
        if(!onlineUsers.hasOwnProperty(obj.userid)) {
            onlineUsers[obj.userid] = obj.username;
            onlineCount++;
        }
        result.onlineUsers = onlineUsers;
        result.onlineCount = onlineCount;
        result.user = obj;
        io.emit('login', result);
    });

    socket.on('message', function(obj){
        io.emit('message', obj);
    });

    socket.on('disconnect', function(){
        if(onlineUsers.hasOwnProperty(socket.name)) {
            var obj = {userid:socket.name, username:onlineUsers[socket.name]};
            delete onlineUsers[socket.name];
            onlineCount--;
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        }
    });
});

server.listen(config.port);
console.log("server listen to port:%s",config.port);

module.exports = app;