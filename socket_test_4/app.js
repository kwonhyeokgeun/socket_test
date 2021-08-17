const express = require('express')
const socket = require('socket.io')
const http = require('http')
const fs = require('fs')
const app = express()
var mysql = require('mysql');
const server = http.createServer(app)


/* 생성된 서버를 socket.io에 바인딩 */
const io = socket(server)

app.use('/css', express.static('./static/css'))
app.use('/js', express.static('./static/js'))

/* Get 방식으로 / 경로에 접속하면 실행 됨 */
app.get('/', function(request, response) {
  fs.readFile('./static/index.html', function(err, data) {
    
    if(err) {
      response.send('에러')
    } else {
      response.writeHead(200, {'Content-Type':'text/html'})
      response.write(data)
      response.end()
    }
  })
})

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Uxis100!',
  database : 'saved'
});

connection.connect();

let roomUserNum = {};

io.sockets.on('connection', function(socket) {
  
  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
  socket.on('newUser', function(name, room) {
    console.log(name + '님이 접속하였습니다.')

    /* 소켓에 이름 저장해두기 */
    socket.name = name
    socket.room = room
    /* 모든 소켓에게 전송 */
    io.sockets.to(room).emit('update', {type: 'connect', name: 'SERVER', room : room ,message: name + '님이 방에 접속하였습니다.'})
  })

  /* 전송한 메시지 받기 */
  socket.on('message', function(data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    if(data.message !== ""){
      data.name = socket.name
      
      console.log(data)
      var sql = "INSERT INTO "+socket.room+" (userName, msg) VALUES ('"+data.name+"', '"+data.message+"')";
      connection.query(sql, function (err, result) {
	      if (err) throw err;
	      console.log("1 record inserted");
      });

      /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
      socket.broadcast.to(socket.room).emit('update', data);
      
    }
  })

  /* 접속 종료 */
  socket.on('disconnect', function() {
    console.log(socket.name + '님이 나가셨습니다.')

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.to(socket.room).emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'});
  })

  socket.on('join_room', function (room){
    console.log('join room : ' + room)
    if(roomUserNum[room] === undefined) {  //방이 만들어지면 테이블 생성
	    roomUserNum[room]=1;
	    var sql = "CREATE TABLE "+room+" (userName VARCHAR(20),msg VARCHAR(255))";
	    connection.query(sql, function (error, results, fields) {
	      if (error) {
		    console.log(error);
	      }
				//console.log(results);

	    });
	    console.log('make table',room);
    }
    else{   //이미 있는 방에 들어왔으면 이전 대화내용 보내기
      roomUserNum[room] +=1;
      connection.query("SELECT * FROM "+room, function (err, result, fields) {  
        if (err) throw err;
        //console.log(result);
        console.log('request_chat');
        socket.emit('getChat',result)
	    });
    }
    socket.join(room)
  })

  socket.on('leave_room', function (room){
    console.log('leave room : ' + room)
    roomUserNum[room] -=1;
    if(roomUserNum[room] <=0){  //방에 다 나가면 테이블 삭제
      delete roomUserNum[room];
      var sql = "DROP TABLE "+socket.room;
      connection.query(sql, function (err, result) {
    	  if (err) throw err;
    	  console.log("Table deleted");
      });
    }
    socket.leave(room)
  })//아직 사용안함 

})



/* 서버를 8080 포트로 listen */
server.listen(80, function() {
  console.log('서버 실행 중..')
})

