const express = require('express')
const socket = require('socket.io')
const http = require('http')
const fs = require('fs')
const app = express()
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

io.sockets.on('connection', function(socket) {
  //JSON파일 앞부분 적어주기
  //fs.writeFileSync("./chat.json",'{"chat":[{"type":"message","message":"chatting start","name":"server"}');
  
  
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

      /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
      socket.broadcast.to(socket.room).emit('update', data);
      /*
      //JSON 파일에 data추가
      fs.appendFileSync("./chat.json",",");
      fs.appendFileSync("./chat.json",JSON.stringify(data));
      //마지막에 ]} 을 붙여줘야함
      */
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
    socket.join(room)
  })

  socket.on('leave_room', function (room){
    console.log('leave room : ' + room)
    socket.leave(room)
  })//아직 사용안함 

})



/* 서버를 8080 포트로 listen */
server.listen(8080, function() {
  console.log('서버 실행 중..')
})

