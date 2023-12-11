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
const projectiles = {}

socket.on('updateProjectiles', (backendProjectiles) => {
  for (const id in backendProjectiles){
    const backendProjectile = backendProjectiles[id]

    if (!projectiles[id]){
      projectiles[id] = new Projectile(backendProjectile.x, backendProjectile.y, 5, players[backendProjectile.playerId]?.color, backendProjectile.velocity)
    } else {
      projectiles[id].x += backendProjectile.velocity.x
      projectiles[id].y += backendProjectile.velocity.y
    }  
  }
  
  //remocao de projeteis
  for(const id in projectiles){
    if(!backendProjectiles[id]){
      delete projectiles[id]
    }
  }
  
})

//puxar do backend quais são os jogadores
socket.on('updatePlayers', (backendPlayers) => {
  for(const id in backendPlayers){
    const backendPlayer = backendPlayers[id]

    if(!players[id]){ //se o player nao existe ainda => criar
      players[id] = new Player(backendPlayer.x, backendPlayer.y,10,backendPlayer.color)

      document.querySelector('#playerLabels').innerHTML += `<div player-id="${id}" count-score="${backendPlayer.score}"> ${backendPlayer.username}: ${backendPlayer.score} </div>`

    } else { // se o player ja existe => atualizar atributos

      document.querySelector(`div[player-id="${id}"]`).innerHTML = `${backendPlayer.username}: ${backendPlayer.score}`

      document.querySelector(`div[player-id="${id}"]`).setAttribute('count-score', backendPlayer.score)

      const parentDiv = document.querySelector('#playerLabels')
      const childDiv = Array.from(parentDiv.querySelectorAll('div'))

      childDiv.sort((a, b) => {
        const scoreA = Number(a.getAttribute('count-score'))
        const scoreB = Number(b.getAttribute('count-score'))

        return scoreB - scoreA
      })

      childDiv.forEach((div) => {
        parentDiv.removeChild(div)
      })

      childDiv.forEach((div) => {
        parentDiv.appendChild(div)
      })

      if(id === socket.id){ //reconciliacao do servidor para o player 
        players[id].x = backendPlayer.x
        players[id].y = backendPlayer.y

        const lastInputIndex = playersInput.findIndex(input => {
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })

        if(lastInputIndex > -1){
          playersInput.splice(0, lastInputIndex + 1)
        }

        playersInput.forEach(input =>{
          players[id].x += input.dx
          players[id].y += input.dy
        })
      } else { //atualizacao dos outros players
        players[id].x = backendPlayer.x
        players[id].y = backendPlayer.y
        
      }
    }
  }
  
  //remocao de player
  for(const id in players){
    if(!backendPlayers[id]){
      const divDelete = document.querySelector(`div[player-id="${id}"]`)
      divDelete.parentNode.removeChild(divDelete)

      if(id === socket.id){
        document.querySelector('#usernameForm').style.display = 'block'
      }

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

  for (const id in projectiles){
    const projectile = projectiles[id]
    projectile.draw()
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

const SPEED = 5
const playersInput = []
let sequenceNumber = 0
setInterval(() => { //mandar a movimentacao para o backend e realizar a movimentcao no frontend tbm (diminui o atraso)
  if(keys.w.pressed){
    sequenceNumber++
    playersInput.push({sequenceNumber, dx:0, dy: -SPEED})
    players[socket.id].y -= SPEED
    socket.emit('keydown', {keycode:'KeyW', sequenceNumber})
  }
  if(keys.a.pressed){
    sequenceNumber++
    playersInput.push({sequenceNumber, dx:-SPEED, dy:0})
    players[socket.id].x -= SPEED
    socket.emit('keydown', {keycode:'KeyA', sequenceNumber})
  }
  if(keys.s.pressed){
    sequenceNumber++
    playersInput.push({sequenceNumber, dx:0, dy: +SPEED})
    players[socket.id].y += SPEED
    socket.emit('keydown', {keycode:'KeyS', sequenceNumber})
  }
  if(keys.d.pressed){
    sequenceNumber++
    playersInput.push({sequenceNumber, dx:+SPEED, dy:0})
    players[socket.id].x += SPEED
    socket.emit('keydown', {keycode:'KeyD', sequenceNumber})
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

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    username: document.querySelector('#usernameInput').value,
    width: canvas.width, 
    height: canvas.height, 
    devicePixelRatio
  })
})