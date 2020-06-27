var express = require('express')
var app = express();
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
var socketList ={};
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/client/index.html')
})
app.use('/client',express.static(__dirname+'/client'))
serv.listen(process.env.PORT||2000)
console.log("Server Started")
function Entity(){
  let self = {
    x:250,
    y:250,
    spdX:0,
    spdY:0,
    id:"",
  }
  self.updatePosition = function(){
    self.x+=self.spdX;
    self.y+=self.spdY;
  }
  self.update = function(){
    self.updatePosition()
  }
  self.getDistance=function(pt){
    return Math.sqrt(Math.pow(self.x-pt.x,2)+Math.pow(self.y-pt.y,2))
  }
  return self;
}
function Bullet(parent,angle){
  let self = Entity()
  self.id = Math.random()
  self.spdX = Math.cos(angle)*10;
  self.spdY = Math.sin(angle)*10
  self.timer = 0;
  self.parent = parent;
  self.toRemove = false;
  let super_update = self.update;
  self.update = function(){
    self.timer++;
    if(self.timer>100){
      self.toRemove = true;
    }
    super_update()
    for(let i in Player.list){
      let p = Player.list[i]
      if(self.getDistance(p)<32&&self.parent!== p.id){
        //handle collision
        self.toRemove = true;
      }
    }
  }
  self.getInitPack = function(){
  return   {
      id:self.id,
      x:self.x,
      y:self.y,
    };
  }
  self.getUpdatePack = function(){
    return {
      id:self.id,
      x:self.x,
      y:self.y,
    }
  }
  Bullet.list[self.id] = self;
  initPack.bullet.push(self.getInitPack())
  return self;
}
Bullet.list = {}
Bullet.update = function(){
  let pack = []
  for(let i in Bullet.list){
    let bullet = Bullet.list[i]
    bullet.update()
    if(bullet.toRemove){
      delete Bullet.list[i]
      removePack.bullet.push(bullet.id)
    }else{
    pack.push(self.getUpdatePack())
  }
  }
  return pack;
}
Bullet.getAllInitPack = function(){
  var bullets = []
  for(let i in Bullet.list){
    bullets.push(Bullet.list[i].getInitPack())
  }
  return bullets;
}
function Player(id){
  let self = Entity();
    self.id=id
    self.number=""+Math.floor(Math.random()*10)
    self.pressingRight=false
    self.pressingLeft=false
    self.pressingUp=false
    self.pressingDown=false
    self.mousePress = false;
    self.mouseAngle = 0;
    self.maxSpd=10
    let super_update = self.update;
    self.update = function(){
      self.updateSpd()
      super_update()
      if(self.mousePress){
        self.shootBullet(self.mouseAngle)
      }
    }
    self.shootBullet = function(angle){
      let b = Bullet(self.id,angle)
      b.x = self.x;
      b.y = self.y
    }
  self.updateSpd = function(){
    if(self.pressingRight){
      self.spdX=self.maxSpd;
    }else  if(self.pressingLeft){
      self.spdX=-self.maxSpd
    }else{
      self.spdX = 0;
    }
    if(self.pressingDown){
      self.spdY=self.maxSpd
    }else if(self.pressingUp){
      self.spdY=-self.maxSpd
    }else{
      self.spdY = 0;
    }
  }
  self.getInitPack = function(){
  return   {
      id:self.id,
      x:self.x,
      y:self.y,
      number:self.number,
    };
  }
  self.getUpdatePack = function(){
    return {
      id:self.id,
      x:self.x,
      y:self.y,
    }
  }
  Player.list[id] = self;
  initPack.player.push(self.getInitPack())
  return self;
}
Player.list = {}
Player.onConnect = function(socket){
   let player = Player(socket.id)
   socket.on('keyPress',(data)=>{
     if(data.inputId =='left'){
       player.pressingLeft = data.state
     }else if(data.inputId=='right'){
       player.pressingRight = data.state;
     }else if(data.inputId =='up'){
       player.pressingUp = data.state
     }else if(data.inputId =='down'){
       player.pressingDown = data.state;
     }else if(data.inputId =='click'){
       player.mousePress = data.state;
     }else if(data.inputId=='mouseAngle'){
       player.mouseAngle = data.state;
     }
   })
   socket.emit('init',{
     player:Player.getAllInitPack(),
     bullet:Bullet.getAllInitPack(),
   })
}
Player.getAllInitPack = function(){
  var players = []
  for(let i in Player.list){
    players.push(Player.list[i].getInitPack())
  }
  return players;
}
Player.onDisconnect = function(socket){
      delete Player.list[socket.id]
      removePack.player.push(socket.id)
}
Player.update = function(){
  let pack = []
  for(let i in Player.list){
    let player = Player.list[i]
    player.update()
    pack.push(self.getUpdatePack())
  }
  return pack;
}
var users = {
  "bob":"asd",
  "bob2":"bob",
}
function isValidPassword(data,cb){
  setTimeout(()=>{
  cb(users[data.username] === data.password)
},10);
}
function isUsernameTaken(data,cb){
  setTimeout(()=>{
  cb(users[data.username])
  },10);
}
function addUser(data,cb){
  setTimeout(()=>{
  users[data.username] = data.password;
  cb()
},10);
}
io.sockets.on('connection',(socket)=>{
  socket.id = Math.random()
  socketList[socket.id] = socket;
  socket.on('signIn',(data)=>{
    isValidPassword(data,(res)=>{
      if(res){
        Player.onConnect(socket)
        socket.emit('signInResponse',{success:true})
      }else{
        socket.emit('signInResponse',{success:false})
      }
    })
  })
  socket.on('signUp',(data)=>{
    isUsernameTaken(data,(res)=>{
      if(res){
        socket.emit('signUpResponse',{success:false})
      }else{
        addUser(data,()=>{
        socket.emit('signUpResponse',{success:true})
      });
      }
    })
  })
  socket.on('disconnect',()=>{
    delete socketList[socket.id]
    Player.onDisconnect(socket)
  })
  socket.on('sendMsgToServer',(data)=>{
    let playerName = (""+socket.id).slice(2,7)
    for(let i in socketList){
      socketList[i].emit('addToChat',playerName+": " + data)
    }
  })
})
var initPack = {player:[],bullet:[]}
var removePack = {player:[],bullet:[]}
setInterval(()=>{
  let pack ={
    player:Player.update(),
    bullet:Bullet.update(),
  }
  for(let i in socketList){
    let socket = socketList[i]
      socket.emit('init',initPack)
      socket.emit('update',pack)
      socket.emit('remove',removePack)
  }
  initPack.player = [];
  initPack.bullet = []
  removePack.player= []
  removePack.bullet = []
},1000/40)
