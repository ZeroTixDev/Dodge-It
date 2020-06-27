const express = require('express')
const app = express();
const serv = require('http').Server(app)
const io = require('socket.io')(serv,{})
var socketList ={};
var playerList={}
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/client/index.html')
})
app.use('/client',express.static(__dirname+'/client'))
serv.listen(2000)
console.log("Server Started")
class Player{
  constructor(id){
    this.x = 250;
    this.y = 250;
    this.id =id;
    this.number = ""+Math.floor(10*Math.random())
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.maxSpd = 10;
  }
  updatePosition(){
    if(this.pressingRight){
      this.x+=this.maxSpd;
    }
    if(this.pressingLeft){
      this.x-=this.maxSpd
    }
    if(this.pressingUp){
      this.y-=this.maxSpd
    }
    if(this.pressingDown){
      this.y+=this.maxSpd;
    }
  }
}
io.sockets.on('connection',(socket)=>{
  socket.id = Math.random()
  socket.x = 0;
  socket.y = 0;
  socket.number = ""+Math.floor(10*Math.random())
  socketList[socket.id] = socket;
  let player = new Player(socket.id)
  playerList[socket.id] =  player;
  console.log('socket connection')
  socket.on('disconnect',()=>{
    delete socketList[socket.id]
    delete playerList[socket.id]
  })
  socket.on('keyPress',(data)=>{
  if(data.inputId ==='left'){
    player.pressingLeft=data.state;
  }else if(data.inputId ==='right'){
    player.pressingRight=data.state;
  }else if(data.inputId ==='up'){
    player.pressingUp=data.state;
  }else if(data.inputId ==='down'){
    player.pressingDown=data.state;
  }
  })
})
setInterval(()=>{
  let pack = []
  for(let i in playerList){
    let player = playerList[i];
    player.updatePosition()
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number,
    })
  }
  for(let i in socketList){
    let socket = socketList[i]
    socket.emit('newPosition',pack);
  }},1000/25)
