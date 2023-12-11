//BACKEND DO JOGO

const express = require('express')
const app = express()

//importando dependencias para criação do servidor
const http = require('http')
const server = http.createServer(app) //servidor http
const { Server } = require('socket.io') //servidor socket.io
const io = new Server(server, {pingInterval:2000, pingTimeout: 2000})

//porta na qual a aplicação vai rodar
const port = 3000

app.use(express.static('public'))

//retornar requisicao get com o HTML do jogo
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

//armazena os jogadores com suas posicoes e cores
const players = {}
const projectiles = {}

let projectId = 0

//evento quando um player novo se conecta
io.on('connection', (socket)=> {
  console.log('a user connected')

  io.emit('updatePlayers', players) //atualizar numero de players para todos os jogadores

  socket.on('shoot', ({x, y, angle}) => {
    projectId++;

    const velocity = {
      x: Math.sin(angle) * 5,
      y: Math.cos(angle) * 5
    }

    projectiles[projectId] = {
      x, y, velocity, playerId: socket.id
    }

  })

  socket.on('initGame', ({username, width, height, devicePixelRatio}) => {
    players[socket.id] = { //definir atributos do novo player
      x:500*Math.random(),
      y:500 * Math.random(),
      color:'hsl('+ 360*Math.random() +',100%,50%)',
      sequenceNumber: 0,
      score: 0,
      username: username
    }
    players[socket.id].canvas = {
      width,
      height
    }
    players[socket.id].radius = 10
    if(devicePixelRatio > 1){
      players[socket.id].radius = 20
    }

    console.log(players)

  })

  //caso o player se desconecte
  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete players[socket.id] //deletar jogador
    io.emit('updatePlayers', players) //atualizar novamente o numero de jogadores
  })


  //capturar movimentacao do player
  const SPEED = 5
  socket.on('keydown', ({keycode, sequenceNumber}) => {

    if(!players[socket.id]){
      return
    }

    players[socket.id].sequenceNumber = sequenceNumber
    switch(keycode){
      case 'KeyW':
        players[socket.id].y -= SPEED
        break
      case 'KeyA':
        players[socket.id].x -= SPEED
        break
      case 'KeyS':
        players[socket.id].y += SPEED
        break
      case 'KeyD':
        players[socket.id].x += SPEED
        break
    }
  })

})

///atualizar o estado dos jogadores de tempo em tempo
setInterval(() => {

  //atualizar projeteis
  for (const id in projectiles){
    projectiles[id].x += projectiles[id].velocity.x
    projectiles[id].y += projectiles[id].velocity.y

    const proj_radius = 5
  
    if(projectiles[id].x - proj_radius >= players[projectiles[id].playerId]?.canvas.width ||
      projectiles[id].x + proj_radius <=0 || 
      projectiles[id].y - proj_radius >= players[projectiles[id].playerId]?.canvas.height ||
      projectiles[id].y + proj_radius <=0 
      ){
      delete projectiles[id]
      continue
    }

    for (const playerId in players){
      const player = players[playerId]
      const distance = Math.hypot(
        projectiles[id].x - player.x,
        projectiles[id].y - player.y
      )

      if (distance < 5 + player.radius && projectiles[id].playerId !== playerId){
        if (players[projectiles[id].playerId]){
          players[projectiles[id].playerId].score++
        }
        delete projectiles[id]
        delete players[playerId]
        break
      }
    }

  }

  io.emit('updateProjectiles', projectiles)
  io.emit('updatePlayers', players)
}, 15)


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log("Contents loaded")