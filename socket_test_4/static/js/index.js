var socket = io()
var room
/* 접속 되었을 때 실행 */
socket.on('connect', function() {
  /* 이름을 입력받고 */
  var name = prompt('이름을 입력해주세요.', '')
  room = prompt('입장할 방 번호를 입력해주세요.', '')
  join_room(name, room); //해당 방에 입장

  /* 이름이 빈칸인 경우 */
  if(!name) {
    name = '익명'
  }
  
  /* 서버에 새로운 유저가 왔다고 알림리고 이름과 방 저장 */
  socket.emit('newUser', name, room)
})

/* 서버로부터 데이터 받은 경우 */
socket.on('update', function(data) {
  var chat = document.getElementById('chat')

  var message = document.createElement('div')
  var node = document.createTextNode(`${data.name}: ${data.message}`)
  var className = ''

  // 타입에 따라 적용할 클래스를 다르게 지정
  switch(data.type) {
    case 'message':
      className = 'other'
      break

    case 'connect':
      className = 'connect'
      break

    case 'disconnect':
      className = 'disconnect'
      break
  }
  
  message.classList.add(className)
  message.appendChild(node)
  chat.appendChild(message)
  console.log(className, node);
})

/*이전대화 가져와서 채팅창에 추가*/
socket.on('getChat',function(data){
  console.log(data);
  var chat = document.getElementById('chat')
  for(let i =0; i<data.length; i++){

    var message = document.createElement('div')
    var node = document.createTextNode(`${data[i].userName}: ${data[i].msg}`)
    var className = 'other'
    message.classList.add(className)
    message.appendChild(node)
    chat.appendChild(message)


  }
})

/* 메시지 전송 함수 */
function send() {
  // 입력되어있는 데이터 가져오기
  var message = document.getElementById('test').value
  // 가져왔으니 데이터 빈칸으로 변경
  document.getElementById('test').value = ''

  // 내가 전송할 메시지 클라이언트에게 표시
  var chat = document.getElementById('chat')
  var msg = document.createElement('div')
  var node = document.createTextNode('나: ' + message)
  msg.classList.add('me')
  msg.appendChild(node)
  chat.appendChild(msg)

  // 서버로 message 이벤트 전달 + 데이터와 함께
  socket.emit('message', {type: 'message', message: message})
  
}
/* 방 입장 함수*/
function join_room(name, room){
  console.log(name +  "님이 " + room + "방에 입장했습니다.")
  socket.emit('join_room',room)
}
/* 방 퇴장 함수*/
//아직 사용 안함
function leave_room(name, room){
  console.log(name +  "님이 " + room + "방에 입장했습니다.")
  socket.emit('leave_room',room)
}
