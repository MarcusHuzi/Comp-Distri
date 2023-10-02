//FRONTEND DO JOGO  

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

//armazenar jogadores
const players = {}

//puxar do backend quais são os jogadores
socket.on('updatePlayers', (backendPlayers) => {
  for(const id in backendPlayers){
    const backendPlayer = backendPlayers[id]

    if(!players[id]){
      players[id] = new Player(backendPlayer.x, backendPlayer.y,10,backendPlayer.color)
    } else {
      players[id].x = backendPlayer.x
      players[id].y = backendPlayer.y
    }
  }

  for(const id in players){
    if(!backendPlayers[id]){
      delete players[id]
    }
  }

})


//desenhar jogadores
let animationId
let score = 0
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (const id in players){
    const player = players[id]
    player.draw()
  }
}

animate()

//pegar a movimentcao dos jogadores
const keys = {
  w:{
    pressed:false
  },
  a:{
    pressed:false
  },
  d:{
    pressed:false
  },
  s:{
    pressed:false
  }
}

const SPEED = 10

setInterval(() => { //mandar a movimentacao para o backend e realizar a movimentcao no frontend tbm (diminui o atraso)
  if(keys.w.pressed){
    players[socket.id].y -= SPEED
    socket.emit('keydown', 'KeyW')
  }
  if(keys.a.pressed){
    players[socket.id].x -= SPEED
    socket.emit('keydown', 'KeyA')
  }
  if(keys.s.pressed){
    players[socket.id].y += SPEED
    socket.emit('keydown', 'KeyS')
  }
  if(keys.d.pressed){
    players[socket.id].x += SPEED
    socket.emit('keydown', 'KeyD')
  }
}, 15)

window.addEventListener('keydown', (event) => { //evento para quando a tecla eh pressionada
  if(!players[socket.id]){
    return
  }

  switch(event.code){
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
  }

})

window.addEventListener('keyup', (event) => { //evento para quando a tecla eh solta
  if(!players[socket.id]){
    return
  }

  switch(event.code){
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
  }

})