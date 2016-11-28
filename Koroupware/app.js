/**
 * Module dependencies.
 */
var socketio = require('socket.io');
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var jade = require('jade');
var user = require('./routes/user');
var imageRoom = require('./routes/imageRoom');
var session = require('express-session');

var fs = require('fs');

var app = express();

// all environments
app.use(session({
	secret: 'koroupware',
	resave: false,
	saveUninitialized: true
}));
app.set('port', process.env.PORT || 8082);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/imageroom', imageRoom.login);
app.get('/imageroom/lobby', imageRoom.lobby);
app.get('/imageroom/canvas', imageRoom.canvas);


/*
app.get('/imageroom/test', imageRoom.test);
*/

var server = http.createServer(app);

server.listen(app.get('port'), function() {
	console.log('서버 시작');
});


var imgList = {};
var empList = {};

//소켓 서버 생성
var io = socketio.listen(server);

io.sockets.on('connection', function(socket){
	var isInRoom = false;
	
	var emp_no;
	var image_room_no;
	
	socket.on('join', function(data){
		isInRoom = true;
		
		image_room_no = data.image_room_no;
		emp_no = data.emp_no;
		
		socket.join(image_room_no);
		io.sockets.to(this.id).emit('drawImage', imgList[image_room_no]);
		
		if(empList[image_room_no] == undefined){
			empList[image_room_no] = [];
		}
		
		empList[image_room_no].push(emp_no);
		io.sockets.to(image_room_no).emit('joinList', empList[image_room_no]);
	});
	
	socket.on('draw', function(data){
		io.sockets.to(image_room_no).emit('line', data);
	});
	
	socket.on('create_room', function(data){
		io.sockets.emit('create_room', data);
	});
	
	socket.on('clean', function(){
		io.sockets.to(image_room_no).emit('clean');
	});
	
	socket.on('drawImage', function(data){
		io.sockets.to(image_room_no).emit('drawImage', data.toString());
	});
	
	socket.on('saveImage', function(data){
		imgList[image_room_no] = data.toString();
	});
	
	socket.on('loadImage', function(){
		io.sockets.emit('drawImage', imgList[image_room_no]);
		
		console.log(empList[image_room_no]);
	});
	
	socket.on('disconnect', function(){
		if(isInRoom){
			var index = empList[image_room_no].indexOf(emp_no);
			
			empList[image_room_no].splice(index, 1);
			
			io.sockets.to(image_room_no).emit('joinList', empList[image_room_no]);
		}
	});
	
	socket.on('addDrawDisable', function(data){
		io.sockets.to(image_room_no).emit('addDrawDisable', data);
	});
	
	socket.on('removeDrawDisable', function(data){
		io.sockets.to(image_room_no).emit('removeDrawDisable', data);
	});
	
	
	//채팅
	socket.on('chat', function(data){
		io.sockets.to(image_room_no).emit('chat', data);
	});
});




