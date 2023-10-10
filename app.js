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

//evento quando um player novo se conecta
io.on('connection', (socket)=> {
  console.log('a user connected')
  players[socket.id] = { //definir atributos do novo player
    x:500*Math.random(),
    y:500 * Math.random(),
    color:'hsl('+ 360*Math.random() +',100%,50%)',
    sequenceNumber: 0
  }

  io.emit('updatePlayers', players) //atualizar numero de players para todos os jogadores

  //caso o player se desconecte
  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete players[socket.id] //deletar jogador
    io.emit('updatePlayers', players) //atualizar novamente o numero de jogadores
  })


  //capturar movimentacao do player
  const SPEED = 5
  socket.on('keydown', ({keycode, sequenceNumber}) => {
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

  console.log(players)
})

///atualizar o estado dos jogadores de tempo em tempo
setInterval(() => {
  io.emit('updatePlayers', players)
}, 15)


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log("Contents loaded")