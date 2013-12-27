
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(8008);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
    socket.on('room', function(room) {
        socket.join(room);
        console.log('joined room: ' + room);
    });
    socket.on('remoteClientSize', function (msg, room) {
        socket.broadcast.to(msg.room).emit('clientSize', msg);
    });
    socket.on('remoteFilterStart', function (msg, room) {
        socket.broadcast.to(msg.room).emit('filterStart', msg);
    });
    socket.on('remoteFilterMove', function (msg, room) {
        socket.broadcast.to(msg.room).emit('filterMove', msg);
    });
    socket.on('remoteFilterEnd', function (msg, room) {
        socket.broadcast.to(msg.room).emit('filterEnd', msg);
    });
});
