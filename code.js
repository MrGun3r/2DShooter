const canvas = document.getElementById("canvas")
ctx = canvas.getContext("2d")
ctx.imageSmoothingEnabled= false
canvas.width = screen.width
canvas.height = screen.height

let rect = canvas.getBoundingClientRect()
const mouse = {pos:{x:0,y:0},left:{pressed:false},right:{pressed:false},event:{x:0,y:0}}
const keys = {a:{pressed:false},w:{pressed:false},s:{pressed:false},d:{pressed:false},e:{pressed:false},r:{pressed:false}}
const players = []
const obstacles = []
const enemies = []
const bullets = []
const particles = []
const guns = []
const items = []



//GENERAL
var mainMenu = false
var gameEnded = false
var gamePaused = false
var room = 0
var timeSkip = 0
var mapLoading = false
var mapOpacity = 0
var elapsedTime = 0
//GENERAL
const worldBorder = {x:0,y:0}
worldBorder.x -= worldBorder.x%50
worldBorder.y -= worldBorder.y%50
const camera = {x:0,y:0}

var interacted = false

// CROSSHAIR
  var crosshairSize = 6
  var crosshairWidth = 5
  var crosshairGap = 2
  var crosshairColor = "green"
//
// FPS 
var fps = 60;
var fpsMax = 1;
var fpsLimit = 60
var elapsedTime = 0;
var then = performance.now()
var startTime = performance.now()
///------ASSETS-------///////// 

var floor = new Image()
floor.src = "assets/background.jpg" 
var wall = new Image()
wall.src = "assets/Wall.png"
var bullet = new Image()
bullet.src = 'assets/bullet.png'
var gun = new Image()
gun.src = "assets/guns.png"
var muzzleFlash = new Image()
muzzleFlash.src = "assets/flash.png"

var item = new Image()
item.src = "assets/items.png"

///--------------////////

///-----SOUNDS-------/////
/// NOTE: IN ORDER TO RUN ANY OF THE SOUNDS MAKE SURE TO PUSH TO ARRAY 'noises' ...
/// ... WITH THE ATTRIBUTE ".cloneNode()"
/// THE LOOP WILL TAKE CARE DEALING WITH THE SOUND 
const sounds = {
  machinegun:new Audio("sounds/MachineGun.wav"),
  revolver:  new Audio("sounds/Revolver.wav"),
  shotgun:   new Audio("sounds/Shotgun.wav"),
  smg:       new Audio("sounds/SMG.wav"),
  throw:     new Audio("sounds/Throw.wav"),
  reload:    new Audio('sounds/Reload.wav'),
  swing1:    new Audio('sounds/Swing1.wav'),
  swing2:    new Audio('sounds/Swing2.wav'),
  noammo:    new Audio('sounds/NoAmmo.wav'),
  lowammo:   new Audio('sounds/LowAmmo.wav'),
  pickup:    new Audio('sounds/Pickup.wav'),
  glass:     new Audio('sounds/Glass1.wav'),
  health:    new Audio('sounds/Health.wav'),
  walk:      new Audio('sounds/walk1.wav')
}

const noises = []
//(SUB-SOUNDS) ACCESS-KEYS -------///
sounds.reload.accessKey = "reload"
sounds.noammo.accessKey = "noammo"
sounds.walk.accessKey = 'walk'
//////------------//////////



class Player{
    constructor(ctx,position){
      this.ctx = ctx 
      this.position = position
      this.velocity ={
       x:0,
       y:0
      } 
      this.walkIndex = 1
      this.walk = "walk"+this.walkIndex
      // 0 - NONE
      // 1 - PISTOL
      // 2 - SHOTGUN
      // 3 - MACHINE GUN
      // 4 - SUBMACHINE GUN
      this.weapon = 3
      this.bullets = {
        // CURRENT
        light:10,
        heavy:30,
        shells:5,
        // MAX
        maxLight: 300,
        maxHeavy:150,
        maxShells:30,
        // VARIABLES
        inAction:0,
        LowAmmo:0
      }
      this.magmax = 0
      this.fist = {
        active:true,
        punched:false,
        reach:0,
        attacked:false,
        arm:0,
        hand:false // FALSE FOR LEFT , TRUE FOR RIGHT
      }
      this.pickupbool = true
      this.mag = 25
      this.gun = {
        firerate:500,
        loading:false,
        active:true,
        fire:false,
        reloading:false,
        reloadCancel:false
      }
      if(this.weapon == 1){
        this.gun.firerate = 500 
        
      }
      if(this.weapon == 3){
        this.gun.firerate = 100 
        
      }
      if(this.weapon == 2){
        this.gun.firerate = 1000
        
      }
      if(this.weapon == 4){
        this.gun.firerate = 50 
      }
      //////////
      this.health = 100
      this.healthMax = 100
      //////////
      this.knockback = {
        x:0,
        y:0
      }
      this.terminalVelocity = 100 * 1/fps
      this.frictionCoefficient = 0.8 * 30/fps
      this.acceleration = 30 * 1/fps
      this.size = {height:20,width:20}
      this.angle = 0
    }
    init(){
      this.draw()
      this.update()
      // CAMERA MOVEMENT 
      this.camera()
      // ESSENTIAL CONTROLS 
      this.movement()
      this.rotate()
      // ATTACK
      this.arm()
      this.shoot()
      this.weaponInfo() 
      // THROW AND PICKUP WEAPON 
      this.throw()
      this.pickup()
      // OUT OF BOUNDS LIMITS 
      this.mapLimit()
      // DEMISE
      if(this.health <= 0){
        this.death()
        this.health = 0
      }
      // RELOAD
      if(this.weapon > 0){
        if(keys.r.pressed){
        this.reload()
      }}
      // UPDATE AMMO
      this.ammo()
        // HTML 
        this.HTMLINFO()
      // COLLISION 
      this.collision()

    }
    HTMLINFO(){
      document.getElementById('magCount').innerHTML = this.mag +"/"+this.bullets.inAction
      document.getElementById('healthCount').innerHTML = "+"+this.health
      document.querySelector(':root').style.setProperty('--health',this.health+"%")
      if(this.weapon > 0){
        if(this.gun.reloading && !this.gun.reloadCancel){
        document.getElementById('ammoStatus').innerHTML = "Reloading"
      }
      else if (this.bullets.inAction <= 0){document.getElementById('ammoStatus').innerHTML = "NoAmmo"}
      else if (this.mag <= this.bullets.LowAmmo){document.getElementById('ammoStatus').innerHTML = "LowAmmo"}
      else {document.getElementById('ammoStatus').innerHTML = ""}
      }
      else {document.getElementById('ammoStatus').innerHTML = ""}
      if(this.weapon == 0){
        document.querySelector(':root').style.setProperty('--mag',0+"%")
      }
      if(this.weapon == 1){
        document.querySelector(':root').style.setProperty('--mag',this.mag*14.28+"%")
      }
      if(this.weapon == 2){
        document.querySelector(':root').style.setProperty('--mag',this.mag*20+"%")
      }
      if(this.weapon == 3){
        document.querySelector(':root').style.setProperty('--mag',this.mag*4+"%")
      }
      if(this.weapon == 4){
        document.querySelector(':root').style.setProperty('--mag',this.mag*3.333+"%")
      }

      if(room > 0){
        if(enemies.length <= 0){
        document.getElementById('enemiesText').innerHTML = "Exit room"
      }
      else {
        document.getElementById('enemiesText').innerHTML = enemies.length+' left'
      }
      }
      else {
        document.getElementById('enemiesText').innerHTML = " "
      }
      document.getElementById('room').innerHTML = "Room "+room
      
    }
    rotate(){
      this.angle = Math.atan2(mouse.pos.y-this.position.y-this.size.height/2,mouse.pos.x-this.position.x-this.size.width/2)
    }
    collision(){
      obstacles.forEach((obstacle)=>{
        if (Collision(this,obstacle)){
          CollisionCorrection(this,obstacle)
        }
       })
    }
    mapLimit(){
      if(this.position.x < 0){
        this.position.x = 0
      }
      if(this.position.y < 0){
        this.position.y = 0
      }
      if (this.position.x + this.size.width > canvas.width + worldBorder.x){
        this.position.x = canvas.width + worldBorder.x - this.size.width
      }
      if (this.position.y + this.size.height > canvas.height + worldBorder.y){
        this.position.y = canvas.height + worldBorder.y - this.size.height
      }
    }
    ammo(){
      if(this.weapon == 0){
        this.bullets.inAction = 0
      }
      if(this.weapon == 1 ||this.weapon == 4){
        this.bullets.inAction = this.bullets.light
      }
      if(this.weapon == 2){
        this.bullets.inAction = this.bullets.shells
      }
      if(this.weapon == 3){
        this.bullets.inAction = this.bullets.heavy
      }
    }
    movement(){
      this.frictionCoefficient = 0.01**(1/fps)
        if (keys.a.pressed && this.velocity.x > -this.terminalVelocity){
         this.velocity.x -= this.acceleration
        }
        else if (keys.d.pressed && this.velocity.x < this.terminalVelocity){
          this.velocity.x += this.acceleration
        }
        else {
            this.velocity.x *= this.frictionCoefficient
        }
        if (keys.w.pressed && this.velocity.y > -this.terminalVelocity){
            this.velocity.y -= this.acceleration
        }
        else if (keys.s.pressed && this.velocity.y < this.terminalVelocity){
            this.velocity.y += this.acceleration
        }
        else{
            this.velocity.y *= this.frictionCoefficient
        }

        if(Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1){      
          if(noises.length > 0){
            for(let i =0;i<noises.length;i++){
              if(noises[i].accessKey == "walk"){
                break
              }
              else{
                if(i >= noises.length - 1){
                  noises.push(sounds.walk.cloneNode())
                }
                } 
              }
          }
          else{
           noises.push(sounds.walk.cloneNode())
          }
        }
    }
    camera(){
      if (this.position.x+this.size.width/2 >= canvas.width/2+camera.x && camera.x < worldBorder.x){
        camera.x += Math.abs(this.velocity.x)
      }
      if (this.position.x+this.size.width/2<canvas.width/2+camera.x && camera.x > 0){ 
        camera.x -= Math.abs(this.velocity.x)
      }
      if (this.position.y+this.size.height/2 >= canvas.height/2+camera.y && camera.y < worldBorder.y){
        camera.y += Math.abs(this.velocity.y)
      }
      if (this.position.y+this.size.height/2<canvas.height/2+camera.y && camera.y > 0){
        camera.y -= Math.abs(this.velocity.y)
      }
    }
    arm(){
      if(mouse.left.pressed && this.weapon == 0){
        if(this.fist.active){
          this.fist.active = false
          this.fist.reach = 9 
        }
      }
      if(!this.fist.active){
        if(this.fist.arm < this.fist.reach && !this.fist.punched){
          this.fist.arm += 3 * 30/fps
          this.fist.arm = Math.round(this.fist.arm)
        }
        else if(this.fist.arm > 0){
          this.fist.arm -= 1 * 30/fps
          this.fist.punched = true
          if(!this.fist.attacked){
            bullets.push(new Bullet(ctx,{x:this.position.x+this.size.width/2,y:this.position.y+this.size.height/2,},this.angle,0,0,0,this))
            this.fist.attacked = true
            if(this.fist.hand){
              noises.push(sounds.swing1.cloneNode())
            }
            else{
              noises.push(sounds.swing2.cloneNode())
            }
            
          }
        }
        else {this.fist.active = true;
          this.fist.arm = 0
          this.fist.punched = false; 
          this.fist.hand = !this.fist.hand;
        this.fist.attacked = false}
      }
        
        
     
    }
    reload(){
      if(this.weapon == 1){
        this.magmax = 7
        var r = this.bullets.light
      }
      if(this.weapon == 2){
        this.magmax = 5
        var r = this.bullets.shells
      }
      if(this.weapon == 3){
        this.magmax = 25
        var r = this.bullets.heavy
      }
      if(this.weapon == 4){
        this.magmax = 30
        var r = this.bullets.light
      }

      if(this.mag < this.magmax && !this.gun.reloading){
        if(r>0){
        this.gun.reloading = true
        var temp = this.weapon
        var reloadSound = sounds.reload.cloneNode()
        noises.push(reloadSound)
        var timer = setTimeout(() => {
        if(this.weapon == temp && !this.gun.reloadCancel){
          r -= this.magmax - this.mag
          this.mag = this.magmax
          if(r < 0){
            this.mag += r
            r = 0
        }
        this.gun.reloading = false
        this.gun.active = true
          }
          else{
            clearTimeout(timer);
            this.gun.reloading = false
          this.gun.reloadCancel = false}
            if(this.weapon == 1 || this.weapon == 4){
              this.bullets.light = r 
            }
            if(this.weapon == 2){
              this.bullets.shells = r 
            }
            if(this.weapon == 3){
              this.bullets.heavy = r
            }
      }, 2000);
    }
    else {
      if(noises.length > 0){
      for(let i =0;i<noises.length;i++){
        if(noises[i].accessKey == "noammo"){
          break
        }
        else{
          if(i >= noises.length - 1){
            noises.push(sounds.noammo.cloneNode())}
          }
        }
    }
    else{
      noises.push(sounds.noammo.cloneNode())
    }}
      }
      
    }
    weaponInfo(){
      if(this.weapon == 1){
        this.gun.firerate = 500 
        this.bullets.LowAmmo = 3
      }
      if(this.weapon == 3){
        this.gun.firerate = 100 
        this.bullets.LowAmmo = 5
      }
      if(this.weapon == 2){
        this.gun.firerate = 1000 
        this.bullets.LowAmmo = 2
      }
      if(this.weapon == 4){
        this.gun.firerate = 50 
        this.bullets.LowAmmo = 5
      }
    }
    shoot(){
      if (mouse.left.pressed && this.weapon > 0 && !this.gun.reloading){
        var inaccuracy = Math.sqrt(this.velocity.x**2+this.velocity.y**2)
        if(this.mag > 0){
          if(this.gun.active && !this.gun.loading && this.weapon != 2){
          bullets.push(new Bullet(ctx,{x:this.position.x+this.size.width/2,y:this.position.y+this.size.height/2,},this.angle,inaccuracy,this.weapon,0))
          if(this.weapon == 1){
            noises.push(sounds.revolver.cloneNode())
          }
          if(this.weapon == 3){
           noises.push(sounds.machinegun.cloneNode())       
          }
          if(this.weapon == 4){
            noises.push(sounds.smg.cloneNode())
          }
          if(this.mag <= this.bullets.LowAmmo){
            noises.push(sounds.lowammo.cloneNode())
          }
          this.gun.active = false
          this.mag--
          this.gun.fire = true
        }
        else if (this.gun.active && !this.gun.loading && this.weapon == 2){
            for (let i = -2*Math.PI/24;i<=2*Math.PI/24;i+=Math.PI/24){
              bullets.push(new Bullet(ctx,{x:this.position.x+this.size.width/2,y:this.position.y+this.size.height/2},this.angle+i,inaccuracy,this.weapon,0,this))
            }
            if(this.weapon == 2){
              noises.push(sounds.shotgun.cloneNode())
            }
             if(this.mag <= this.bullets.LowAmmo){
            noises.push(sounds.lowammo.cloneNode())
          }
            this.gun.active = false
            this.mag--
            this.gun.fire = true
        }
        else if (!this.gun.loading){
          this.gun.loading = true
          var loadTimer = setTimeout(()=>{
            this.gun.active = true
            this.gun.loading = false
          },this.gun.firerate)
        }
        else {
          this.gun.fire = false
        }
        }
        else {
          this.gun.fire = false;
          if(noises.length > 0){
            for(let i =0;i<noises.length;i++){
              if(noises[i].accessKey == "noammo"){
                break
              }
              else{
                if(i >= noises.length - 1){
                  noises.push(sounds.noammo.cloneNode())}
                }
              }
          }
          else{
            noises.push(sounds.noammo.cloneNode())
          }
          }
      }
      else {this.gun.fire = false}
    }
    draw(){
      this.ctx.save()
      this.ctx.lineWidth = 2

      this.ctx.translate(this.position.x+this.size.width/2,this.position.y+this.size.height/2)
      this.ctx.rotate(this.angle)
      this.ctx.translate(-this.size.width/2,-this.size.height/2)
      // AVOID FUTURE PROBLEMS
      this.ctx.beginPath()
      this.ctx.rect(0,0,this.size.width,this.size.height)
      this.ctx.fillStyle = "#dbdbdb"
      this.ctx.fill()
      this.ctx.stroke()
      this.ctx.closePath()

      // WEAPONS
      this.ctx.beginPath()
      if (this.weapon == 0){ // FIST
        this.ctx.lineWidth = 3
        if(this.fist.hand){
          this.ctx.roundRect(this.size.width+this.fist.arm,this.size.height/8,6,6,[6,6,6,6])
          this.ctx.roundRect(this.size.width,5*this.size.height/8,6,6,[6,6,6,6])
        }
        else {
          this.ctx.roundRect(this.size.width,this.size.height/8,6,6,[6,6,6,6])
          this.ctx.roundRect(this.size.width+this.fist.arm,5*this.size.height/8,6,6,[6,6,6,6])
        }
        this.ctx.stroke()
        this.ctx.fill()
      }
      if(this.weapon == 1){ // PISTOL
          this.ctx.rect(this.size.width,this.size.height/2-2.5,10,5)
          if(this.gun.fire){
  
            this.ctx.drawImage(muzzleFlash,this.size.width+10,5,20,10)
          }
          this.ctx.fillStyle = '#8a8988'
          this.ctx.fill()
          this.ctx.stroke()
          }
      if(this.weapon == 2){ // SHOTGUN
            this.ctx.rect(this.size.width,this.size.height/2-2.5,15,5)
            if(this.gun.fire){
              this.ctx.drawImage(muzzleFlash,this.size.width+15,0,30,20)
            }
            this.ctx.fillStyle = '#401500'
            this.ctx.fill()
            this.ctx.stroke()
          }
      if(this.weapon == 3){ // MACHINEGUN
            this.ctx.rect(this.size.width,this.size.height/2-2.5,10,7)
            this.ctx.fillStyle = '#401500'
            this.ctx.fill()
            this.ctx.stroke()
            this.ctx.closePath()
            this.ctx.beginPath()
            this.ctx.rect(this.size.width+10,this.size.height/2-0.5,5,3)
            if(this.gun.fire){
              this.ctx.drawImage(muzzleFlash,this.size.width+15,5,15,10)
            }
            this.ctx.fillStyle = "#303030"
            this.ctx.fill()
            this.ctx.stroke()
          }
      if(this.weapon == 4){ // SMG
            this.ctx.rect(this.size.width,this.size.height/2-2.5,6,7)
            this.ctx.stroke()
            this.ctx.fillStyle ='#1c1b1b'
            this.ctx.fill()
            this.ctx.closePath()
            this.ctx.beginPath()
            this.ctx.rect(this.size.width+6,this.size.height/2-0.5,4,2)
            if(this.gun.fire){
              this.ctx.drawImage(muzzleFlash,this.size.width+15,5,15,10)
            }
            this.ctx.fill()
            this.ctx.stroke()
            
          }
      
      this.ctx.closePath()
      this.ctx.restore()
    }
    hurt(damage,angle){
      this.health -= damage
      this.knockback.x = 5*Math.cos(angle)
      this.knockback.y = 5*Math.sin(angle)
    }
    death(){
      for(let i = 0;i<5;i++){
        particles.push(new Particle(ctx,{x:this.position.x,y:this.position.y},1,1))
      }
      players.splice(players.indexOf(this),1)
    }
    throw(){
      if(keys.e.pressed && this.weapon > 0 && this.pickupbool){
        guns.push(new Gun(ctx,{x:this.position.x,y:this.position.y},{x:10*Math.cos(this.angle),y:10*Math.sin(this.angle)},this.weapon,this.mag,this.gun.active))
        this.weapon = 0
        this.mag = 0
        this.pickupbool = false
        noises.push(sounds.throw.cloneNode())
        if(this.gun.reloading && !this.gun.reloadCancel){
          this.gun.reloadCancel = true
          for(let i = 0;i<noises.length;i++){
            if(noises[i].accessKey == "reload"){
              noises[i].pause()
              noises[i].currentTime = 0
              noises.splice(i,1)
              break
            }
          }
        }
      }
      
    }
    pickup(){
      if(!keys.e.pressed){
        this.pickupbool = true
      }
      guns.forEach((gun,i)=>{
        if(Collision(this,gun) && keys.e.pressed && this.pickupbool){
           guns.splice(i,1)
           this.weapon = gun.type
           noises.push(sounds.pickup.cloneNode())
           this.mag = gun.mag
           this.gun.active = gun.active
           this.pickupbool = false
        }
      })
    }
    update(){
      this.position.x += this.velocity.x + this.knockback.x
      this.position.y += this.velocity.y + this.knockback.y
      if(Math.abs(this.knockback.x) > 0.1){
        this.knockback.x *= 0.7
      }
      else {this.knockback.x = 0}
      if (Math.abs(this.knockback.y) > 0.1){
        this.knockback.y *= 0.7
      }
      else {this.knockback.y = 0}

      this.terminalVelocity = 4 * 30/fps
      this.acceleration = 1 * 30/fps
  
    }
}

class Obstacle{
  constructor(ctx,position,size){
    this.ctx = ctx
    this.position = position
    this.size = size
   
  }
  init(){
    this.update()
  }
  draw(){
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.fillStyle = "#80552a"
    this.ctx.strokeStyle = "#38230f"
    this.ctx.lineWidth = 4
    this.ctx.roundRect(this.position.x,this.position.y,this.size.width,this.size.height,[0,0,0,0])
    
    this.ctx.fill()
    this.ctx.clip()
    this.ctx.globalAlpha = 0.4
    for (let i = 0;i<this.size.width;i += 300){
      for (let j = 0 ;j<this.size.height;j += 300){
      this.ctx.drawImage(wall,this.position.x+i,this.position.y+j,300,300)}
    }
    this.ctx.globalAlpha = 1
    this.ctx.closePath()
    this.ctx.restore()
  }
  
  update(){
    this.draw()
  }
}

class Particle{
  constructor(ctx,position,type,partiType){
    this.ctx = ctx
    this.partiType = partiType
    this.opacity = 1
    // 0 WALL 
    // 1 BLOOD
    this.type = type 
    this.position = position
    this.speed = 10
    this.angle = 2*Math.PI*Math.random() - Math.PI
    this.velocity = {
      x:10*Math.random()*Math.cos(2*Math.PI*Math.random() - Math.PI),
      y:10*Math.random()*Math.sin(2*Math.PI*Math.random() - Math.PI)
    }
    // 0 FOR NORMAL
    // 1 FOR DEATH
    this.size = {
      height:5*Math.random() + this.partiType*10,
      width:10*Math.random() + this.partiType*10
    }
  } 
  init(){
    this.draw()
    this.update()
    this.collision()
  }
  draw(){
    this.ctx.save()
    this.ctx.globalAlpha = this.opacity
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.translate(this.position.x,this.position.y)
    this.ctx.rotate(this.angle)
    this.ctx.translate(-this.position.x,-this.position.y)
    this.ctx.moveTo(this.position.x,this.position.y)
    
    this.ctx.lineTo(this.position.x,this.position.y+this.size.height)
    this.ctx.lineTo(this.position.x+this.size.width,this.position.y-this.size.height/2)
    this.ctx.lineTo(this.position.x,this.position.y)
    if(this.type == 0){
      this.ctx.stroke()
      this.ctx.clip()
      this.ctx.drawImage(wall,this.position.x,this.position.y,100,100)
    }
    if(this.type == 1){
      this.ctx.closePath()
      this.ctx.fillStyle = "#f50008"
      this.ctx.strokeStyle = "#6e2010"
      this.ctx.fill()
      this.ctx.stroke()
    }
    this.ctx.restore()
  }
  collision(){
    obstacles.forEach((obstacle)=> {
      if(Collision(this,obstacle)){
        CollisionCorrection(this,obstacle)
    }
    }) 
  }
  update(){
    this.opacity *= 0.95 + 0.03*this.partiType
    this.position.x += this.velocity.x 
    this.position.y += this.velocity.y
    this.velocity.x *= 0.7
    this.velocity.y *= 0.7
    if (this.opacity < 0.01){
      particles.splice(particles.indexOf(this),1)
    }
    
  }
}

class Bullet {
  constructor(ctx,position,angle,inaccuracy,type,emitter,obj){
    this.ctx = ctx
     this.position = position
     this.originPos = {x:this.position.x,y:this.position.y}

     // 0 PLAYER
     // 1 ENEMY
     this.emitter = emitter 
     this.emitterObj = obj
     this.gotPast = []
     this.gotPast1 = []
     this.inaccuracyRange = 40
     this.angle = angle + (2*Math.random()-1)*inaccuracy / this.inaccuracyRange
     this.speed = 50 * 30/fps
     this.type = type
     this.maxTravelDistance = 1000
     if(this.type == 0){
      this.size = {
        width:20,
        height:30
       }
      this.maxTravelDistance = 30
      this.speed = 10 * 30/fps
      this.damage = 10
     }
     if(this.type == 1 || this.type == 4){
      this.size = {
      width:3,
      height:7,
     }
     this.damage = 15
     }
     else if(this.type == 2){
      this.size = {
        width:7,
        height:5
       }
       this.damage = 20
     }
     else if(this.type == 3){
      this.size = {
        width:6,
        height:10
       }
       this.damage = 20
     }
     
     this.collided = {
      bool:false,
      type
     }
     this.travelDistance = 0
     
  }
  init(){
    this.update()
    this.collision()
    this.draw()
      
  }
  delete(type){
    bullets.splice(bullets.indexOf(this),1);
    if(type != NaN){
      for (let i =0;i<5;i++){
      particles.push(new Particle(ctx,{x:this.position.x,y:this.position.y},type,0))
    }
   }
  }
  draw(){

    if(this.type > 0){
      if (!this.collided.bool){   
    this.ctx.save() 
    this.ctx.beginPath()
    //this.ctx.rect(this.position.x,this.position.y,this.size.height,this.size.width)
    //this.ctx.strokeStyle = 'white'
    //this.ctx.stroke()
    for(let i = 0;i<10;i++){
    this.ctx.translate(this.position.x-2*i*Math.cos(this.angle)+this.size.width/2,this.position.y-2*i*Math.sin(this.angle)
    +this.size.height/2)
    this.ctx.rotate(this.angle+3*Math.PI/2)
    this.ctx.globalAlpha = 1 -i*0.1
    this.ctx.drawImage(bullet,0,0,this.size.width,this.size.height)
    this.ctx.rotate(-this.angle-3*Math.PI/2)
    this.ctx.translate(-this.position.x+2*i*Math.cos(this.angle)-this.size.width/2,-this.position.y+2*i*Math.sin(this.angle)-this.size.height/2)}
    this.ctx.restore()}
    else {
      this.delete(this.collided.type)}
  }
    }
    
  collision(){
    // OBSTACLES 
    if(this.type > 0){
    obstacles.forEach((obstacle)=>{
     if (lineRect({
        position:{x:this.originPos.x,y:this.originPos.y},size:this.size},obstacle,this,false) && 
        lineRect({
          position:{x:this.originPos.x,y:this.originPos.y},size:this.size},obstacle,this,true) != undefined){
          this.position = lineRect({
            position:{x:this.originPos.x,y:this.originPos.y},size:this.size},obstacle,this,true)
          this.collided.bool = true;
          this.collided.type = 0
      }
    })
  }

    // ENEMIES 
    if(this.emitter == 0){
      enemies.forEach((enemy,index)=>{
        if(this.type == 0){
          players.forEach((player)=>{
            if(Collision({position:{
              x:this.position.x-this.size.width/2,
              y:this.position.y-this.size.height/2
            },size:this.size},enemy)){
            enemy.hurt(this.damage,this.angle)
            this.delete(NaN)
            player.fist.attacked = true
          }
          })
          
        }
        if(this.type > 0){
          
      if (lineRect({
        position:{x:this.originPos.x,y:this.originPos.y},size:this.size},enemy,this,false) && 
        lineRect({
          position:{x:this.originPos.x,y:this.originPos.y},size:this.size},enemy,this,true) != undefined && !this.gotPast.includes(index)){
          this.position = lineRect({
            position:{x:this.originPos.x,y:this.originPos.y},size:this.size},enemy,this,true)
          this.collided.bool = true;
          this.collided.type = 1
          enemy.hurt(this.damage,this.angle)}
          
            players.forEach((player)=>{
              if(Math.sqrt((player.position.x+player.size.width/2-this.position.x-this.size.width/2)**2+(player.position.y+player.size.height/2-this.position.y-this.size.height/2)**2)>
              Math.sqrt((player.position.x+player.size.width/2-enemy.position.x-enemy.size.width/2)**2+(player.position.y+player.size.height/2-enemy.position.y-enemy.size.height/2)**2) && !this.gotPast.includes(index)){
                this.gotPast.push(index)
              }
            })
            
          

      }
    })
    }
    
    // PLAYER
    if(this.emitter == 1){
      players.forEach((player,index)=>{
        if (lineRect({
          position:{x:this.originPos.x,y:this.originPos.y},size:this.size},player,this,false) && 
          lineRect({
            position:{x:this.originPos.x,y:this.originPos.y},size:this.size},player,this,true) != undefined && !this.gotPast1.includes(index)){
            this.position = lineRect({
              position:{x:this.originPos.x,y:this.originPos.y},size:this.size},player,this,true)
            this.collided.bool = true;
            this.collided.type = 1
            player.hurt(this.damage,this.angle)
        }
        
          if(Math.sqrt((this.emitterObj.position.x+this.emitterObj.size.width/2-this.position.x-this.size.width/2)**2+(this.emitterObj.position.y+this.emitterObj.size.height/2-this.position.y-this.size.height/2)**2)>
          Math.sqrt((this.emitterObj.position.x+this.emitterObj.size.width/2-player.position.x-player.size.width/2)**2+(this.emitterObj.position.y+this.emitterObj.size.height/2-player.position.y-player.size.height/2)**2) && !this.gotPast1.includes(index)){
            this.gotPast1.push(index)
          }
        
      })
      
    }
    
  }
  update(){
    this.position.x += this.speed*Math.cos(this.angle)
    this.position.y += this.speed*Math.sin(this.angle)
    this.travelDistance += Math.sqrt(
      (this.speed*Math.cos(this.angle))**2 + (this.speed*Math.sin(this.angle))**2
    )
     if (this.travelDistance > this.maxTravelDistance){
      bullets.splice(bullets.indexOf(this),1)
     }
     this.speed = 50 * 30/fps
  }

}

class Enemy{
    constructor(ctx,position,type){
      this.ctx = ctx
      this.position = position
      this.velocity = {x:0,y:0}
      this.size = {width:20,height:20}
      this.speed = 3 * 30/fps
      this.angle = 0
      this.idle = {
        bool:true,
        active:false 
      } 
      this.weapon = type
      // STARTING MAG 
      {
      if(this.weapon == 1){
        this.mag = 7
      }
      if(this.weapon == 2){
        this.mag = 5
      }
      if(this.weapon == 3){
        this.mag = 25
      }
      if(this.weapon == 4){
        this.mag = 30
      }}
      this.reloading = false 
      this.magmax = 0
      this.fist = {
        active:true,
        punched:false,
        attacked:false,
        reach:0,
        arm:0,
        hand:false // FALSE FOR LEFT , TRUE FOR RIGHT
      }
      this.gun = {
        attackrange:0,
        firerate:500,
        loading:false,
        active:true,
        fire:false,
        fired:false,
        ready:false,
        reactionTime:700 * Math.round(2/room)
      }
      if(this.weapon == 1){
        this.gun.firerate = 500  
      }
      if(this.weapon == 3){
        this.gun.firerate = 100        
      }
      if(this.weapon == 2){
        this.gun.firerate = 10000      
      }
      if(this.weapon == 4){
        this.gun.firerate = 50 
      }
      this.health = 50
      this.knockback = {
        x:0,y:0
      }
      
      this.aware = false
      this.alerted = false  

      // PATHFINDING 
      this.trajectory = {
        path:[],
        index:0,
        bool:false,
        fail:false, 
        attempt:0
      }
      this.findingPath = false
      this.inBounds = true
    }
    init(){
      this.draw()
      this.update()

     this.idleMvt()
     this.alert()
     // OUT OF BOUNDS 
     this.mapLimit()
     this.outofbounds()
     // ATTACK
     this.attack()
     this.weaponInfo()
      // DEMISE
      if(this.health <= 0){
        this.death()
      }
      // GUN PROPERTIES 
      this.ammo()
      
      // RELOAD 
      this.reload()
      // COLLISION
      this.collision()
    }
    collision(){
      obstacles.forEach((obstacle)=>{
        if (Collision(this,obstacle)){
          CollisionCorrection(this,obstacle)
        }
       })
    }
    mapLimit(){
      if(this.position.x < 0){
        this.position.x = 0
      }
      if(this.position.y < 0){
        this.position.y = 0
      }
      if (this.position.x + this.size.width > canvas.width + worldBorder.x){
        this.position.x = canvas.width + worldBorder.x - this.size.width
      }
      if (this.position.y + this.size.height > canvas.height + worldBorder.y){
        this.position.y = canvas.height + worldBorder.y - this.size.height
      }
    }
    ammo(){
      if(this.weapon == 1){
        this.magmax = 7
      }
      if(this.weapon == 2){
        this.magmax = 5
      }
      if(this.weapon == 3){
        this.magmax = 25
      }
      if(this.weapon == 4){
        this.magmax = 30
      }
    }
    reload(){
      if (this.mag <= 0 && !this.reloading){
        this.reloading = true
        setTimeout(() => {
          this.mag = this.magmax
          this.reloading = false 
        }, 2000);
      }
    }
    draw(){
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.fillStyle = "#9c240b"
      this.ctx.strokeStyle = "#6e2010"
      this.ctx.lineWidth = 3
      this.ctx.translate(this.position.x+this.size.width/2,this.position.y+this.size.height/2)
      this.ctx.rotate(this.angle)
      this.ctx.translate(-this.size.width/2,-this.size.height/2)
      this.ctx.roundRect(0,0,this.size.width,this.size.height,[2,2,2,2])
      this.ctx.fill() 
      this.ctx.stroke()


      // WEAPON 
      this.ctx.beginPath()
      this.ctx.strokeStyle ="black"
   if(this.weapon == 0){ // HANDS
        this.ctx.lineWidth = 3
        if(this.fist.hand){
          this.ctx.roundRect(this.size.width+this.fist.arm,this.size.height/8,6,6,[6,6,6,6])
          this.ctx.roundRect(this.size.width,5*this.size.height/8,6,6,[6,6,6,6])
        }
        else {
          this.ctx.roundRect(this.size.width,this.size.height/8,6,6,[6,6,6,6])
          this.ctx.roundRect(this.size.width+this.fist.arm,5*this.size.height/8,6,6,[6,6,6,6])
        }
        this.ctx.stroke()
        this.ctx.fill()
   }  
  if(this.weapon == 1){ // PISTOL
  this.ctx.rect(this.size.width,this.size.height/2-2.5,10,5)
  if(this.gun.fired){
    this.ctx.drawImage(muzzleFlash,this.size.width+10,5,15,10)
  }
  this.ctx.fillStyle = '#8a8988'
  this.ctx.fill()
  this.ctx.stroke()
    }
  if(this.weapon == 2){ // SHOTGUN
    this.ctx.rect(this.size.width,this.size.height/2-2.5,15,5)
    if(this.gun.fired){
      this.ctx.drawImage(muzzleFlash,this.size.width+15,5,15,10)
    }
    this.ctx.fillStyle = '#401500'
    this.ctx.fill()
    this.ctx.stroke()
    }
  if(this.weapon == 3){ // MACHINEGUN
    this.ctx.rect(this.size.width,this.size.height/2-2.5,10,7)
    this.ctx.fillStyle = '#401500'
    this.ctx.fill()
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.beginPath()
    this.ctx.rect(this.size.width+10,this.size.height/2-0.5,5,3)
    if(this.gun.fired){
      this.ctx.drawImage(muzzleFlash,this.size.width+10,5,15,10)
    }
    this.ctx.fillStyle = "#303030"
    this.ctx.fill()
    this.ctx.stroke()
    }
  if(this.weapon == 4){ // SMG
    this.ctx.rect(this.size.width,this.size.height/2-2.5,6,7)
    this.ctx.stroke()
    this.ctx.fillStyle ='#1c1b1b'
    this.ctx.fill()
    this.ctx.closePath()
    this.ctx.beginPath()
    this.ctx.rect(this.size.width+6,this.size.height/2-0.5,4,2)
    if(this.gun.fired){
      this.ctx.drawImage(muzzleFlash,this.size.width+10,5,10,10)
    }
    this.ctx.fill()
    this.ctx.stroke()
    
  }
   this.ctx.restore()

     //TRACE PATH 
    //if (this.findingPath) {
     // this.ctx.beginPath()
     // this.ctx.moveTo(this.position.x,this.position.y)
     // this.ctx.lineWidth = 2
     // 
     // for (let i = 0;i<this.trajectory.path.length;i++){
     //   this.ctx.lineTo(this.trajectory.path[i].x,this.trajectory.path[i].y)
     // }
     // this.ctx.stroke()
      //TRACE PATH 
    //   } 
    }
    weaponInfo(){
      if(this.weapon == 1){
        this.gun.firerate = 500 
        this.gun.attackrange = 200
       }
       if(this.weapon == 3){
        this.gun.firerate = 100
        this.gun.attackrange = 150
       }
       if(this.weapon == 2){
        this.gun.firerate = 1000
        this.gun.attackrange = 50
       }
       if(this.weapon == 4){
        this.gun.firerate = 50
        this.gun.attackrange = 100
       }
    }
    attack(){
      players.forEach((player)=>{
      var distance = Math.sqrt((player.position.x+player.size.width/2 - this.position.x-this.size.width/2)**2 + (player.position.y+player.size.height/2 - this.position.y-this.size.height/2)**2)

     if(this.weapon == 0) { // ARM
            if(this.fist.active && distance < 70){
              this.fist.active = false
              this.fist.reach = 9
            }
          
          if(!this.fist.active){
            if(this.fist.arm < this.fist.reach && !this.fist.punched){
              this.fist.arm += 3  * 30/fps  
            }
            else if(this.fist.arm > 0){
              this.fist.arm -= 1* 30/fps
              this.fist.punched = true
              if(distance < 40 && !this.fist.attacked){
                player.hurt(10,this.angle)
                this.fist.attacked = true
                if(this.fist.hand){
                  noises.push(sounds.swing1.cloneNode())
                }
                else {
                  noises.push(sounds.swing2.cloneNode())
                }
              }
            }
            else {this.fist.active = true;
              this.fist.punched = false; 
              this.fist.hand = !this.fist.hand;
             this.fist.attacked = false}
          }
       
     }
    if(this.aware && this.weapon > 0){
     if(this.gun.attackrange > distance){
       this.velocity.x = 0
      this.velocity.y = 0
     }
      
      if(!this.gun.ready){
       this.gun.ready = true
       var delay = setTimeout(()=>{
      this.gun.fire = true
     },this.gun.reactionTime)
      }
     if(this.gun.fire){
       this.shoot()
     }
    }
    
    else {clearTimeout(delay)
    this.gun.fire = false
    this.gun.ready = false;
    this.gun.fired = false}
    })
    }
    shoot(){
      if(this.mag > 0){
      var inaccuracy = Math.sqrt(this.velocity.x**2+this.velocity.y**2)
      if(this.gun.active && !this.gun.loading && this.weapon != 2){
        bullets.push(new Bullet(ctx,{x:this.position.x+this.size.width/2,y:this.position.y+this.size.height/2,},this.angle,inaccuracy,this.weapon,1,this))

        if(this.weapon == 1){
          noises.push(sounds.revolver.cloneNode())
        }
        if(this.weapon == 3){
          noises.push(sounds.machinegun.cloneNode())
        }
        if(this.weapon == 4){
          noises.push(sounds.smg.cloneNode())
        }

        this.gun.active = false
        this.mag--
        this.gun.fired = true
      }
      else if (this.gun.active && !this.gun.loading && this.weapon == 2){
          for (let i = -2*Math.PI/24;i<=2*Math.PI/24;i+=Math.PI/24){
            bullets.push(new Bullet(ctx,{x:this.position.x+this.size.width/2,y:this.position.y+this.size.height/2},this.angle+i,inaccuracy,this.weapon,1,this))
          }
          noises.push(sounds.shotgun.cloneNode())
          this.gun.active = false
          this.mag--
          this.gun.fired = true
      }
      else if (!this.gun.loading){
        this.gun.loading = true
        setTimeout(()=>{
          this.gun.active = true
          this.gun.loading = false
        },this.gun.firerate)
      }
      else {
        this.gun.fired = false
      }
    }
    else {this.gun.fired = false}
    }
    outofbounds(){
      var screenProp = {
          x:camera.x,
          y:camera.y
      ,
        width:canvas.width,
        height:canvas.height
    }
      if(!RectInRect(this,screenProp)){
       this.inBounds = false
      }
      else {this.inBounds = true}
    }
    idleMvt(){
      if (this.idle.bool && !this.idle.active && !this.aware && !this.alerted){
        
      this.idle.active = true
      this.speed = 30 * 1/fps
      var interval = setInterval(()=>{
       if(this.idle.bool){
        this.angle = 2*Math.PI*Math.random() - Math.PI
          if (Math.random()<0.3){
            this.speed = 0
          }
          else {this.speed = 30 * 1 /fps}
       }
       else {clearInterval(interval)}
       
      },
      2000)
    }
    }
    alert(){
      if (this.aware && this.inBounds){
        this.speed = 3
        this.findingPath = false
      }
      else {
          if(!this.trajectory.fail && this.trajectory.path.length != 0 && this.inBounds){
          this.pathFind()
          this.speed = 3 * 30/fps
        }
        else {
          this.alerted = false
          this.findingPath = false
          this.trajectory.fail = false
          this.idle.bool = true;}
          if (this.trajectory.fail){
            this.alerted = false
            this.findingPath = false
            this.trajectory.fail = false
            this.idle.bool = true;} 
      }
    }
    update(){
      this.position.x += this.velocity.x + this.knockback.x
      this.position.y += this.velocity.y + this.knockback.y
      this.velocity.x = this.speed*Math.cos(this.angle)
      this.velocity.y = this.speed*Math.sin(this.angle)
      if (Math.abs(this.knockback.x) > 0.1){
          this.knockback.x *= 0.9
      }
      else {this.knockback.x = 0}
      if(Math.abs(this.knockback.y) > 0.1){
        this.knockback.y *= 0.9
      }
      else {this.knockback.y = 0}
      if(this.aware){
        this.speed = 3 * 30/fps
      }
      
      
      
     }
    hurt(damage,angle){
      this.health -= damage
      for(let i = 0;i<5;i++){
        particles.push(new Particle(ctx,{x:this.position.x,y:this.position.y},1,0))
      }
      this.knockback.x = 5*Math.cos(angle)
      this.knockback.y = 5*Math.sin(angle)
     }
    death(){
        for(let i = 0;i<5;i++){
          particles.push(new Particle(ctx,{x:this.position.x,y:this.position.y},1,1))
        }
        noises.push(sounds.glass.cloneNode())
        if(this.weapon > 0){
          this.drop()
        }
        
        enemies.splice(enemies.indexOf(this),1)
     }
     drop(){
      guns.push(new Gun(ctx,{x:this.position.x,y:this.position.y},{x:5*Math.cos(this.angle),y:5*Math.sin(this.angle)},this.weapon,this.mag))
      if(Math.random() > 0){
        items.push(new Item(ctx,{x:this.position.x,y:this.position.y},{x:3*Math.cos(this.angle),y:3*Math.sin(this.angle)},this.weapon))
      }
    }
     // PATHFINDING - DONT CHANGE 
    pathFind(){
    
      if (RectInRect(this,this.trajectory.path[this.trajectory.index])){
        this.trajectory.index++ 
      }  
      if (this.trajectory.index >= this.trajectory.path.length-1){
        this.findingPath = false
        this.trajectory.bool = false
        this.trajectory.index = 0
        this.trajectory.path = []  
      }
      else {
      this.angle = Math.atan2(this.trajectory.path[this.trajectory.index].y-(this.position.y+this.size.height/2) ,this.trajectory.path[this.trajectory.index].x-(this.position.x+this.size.width/2))
      
  }
    }
    pathFinding(player,enemy){
   
      var pathDistance = 100
      var cols = 50 
      var rows = 50 
      var grid = new Array(cols)
      for (var i = 0; i < cols; i++) {
        grid[i] = new Array(rows);
      }
      
      var closedSet = []
      var openSet = []
      var path = []
      var current;
      class Spot{
        constructor(i,j){
        this.i = i
        this.j = j 
        this.g = 0
        this.f = 900000
        this.width = cols
        this.height = rows
        this.previous;
        this.wall = false 
        this.neighbors = []
    
        this.realSpot = {position:{x:this.i*cols + camera.x,y:this.j*rows+camera.y},size:{width:this.width,height:this.height}}
        obstacles.forEach((obstacle)=>{
          if(Collision(obstacle,this.realSpot)){
            this.wall = true  
          }
        })
        }
      }
      for (var i = 0;i<cols;i++){
        for (var j = 0;j<rows;j++){
          grid[i][j] = new Spot(i,j)
        }
      }
      
      var start = grid[(enemy.position.x-enemy.position.x%cols-(camera.x-camera.x%cols))/cols][(enemy.position.y-enemy.position.y%rows-(camera.y-camera.y%cols))/rows]
      var target = grid[(player.position.x-player.position.x%cols-(camera.x-camera.x%cols))/cols][(player.position.y-player.position.y%rows-(camera.y-camera.y%cols))/rows]
      target.f = 0
      start.wall = false
      target.wall = false
      start.f = Math.abs(target.i-start.i)+ Math.abs(target.j-start.j)
      for (var i =0;i<cols;i++){
        for (var j=0;j<rows;j++){
          if (i < cols - 1) {
            grid[i][j].neighbors.push(grid[i + 1][j]);}
            if (j < rows - 1) {
            grid[i][j].neighbors.push(grid[i][j + 1]);}
            if (j > 0) {
            grid[i][j].neighbors.push(grid[i][j - 1]);}
            if (i > 0) {
            grid[i][j].neighbors.push(grid[i - 1][j]);}

            
        }
      }
      openSet.push(start)
      
    
    for (let k = 0;k<pathDistance;k++){
    if (openSet.length>0){
      var best = 0
      for (var i = 0;i<openSet.length;i++){
        if(openSet[i].f <= openSet[best].f){
          best = i}
      }
      current = openSet[best];
    
      if ((current == target ||  k == pathDistance - 1) && this.trajectory.attempt < 5){
        if(k == pathDistance - 1){
          this.trajectory.attempt++
        }
        else{this.trajectory.attempt = 0}
       for (let l = 0;l<pathDistance;l++){
        path.push({x:current.i*cols + cols / 2 + camera.x - camera.x%cols,y:current.j*rows + rows / 2 + camera.y - camera.y%rows,width:cols,height:rows})
        current = current.previous
        if (!current.previous){
          path.reverse();
          
          enemy.trajectory.path = path
          enemy.trajectory.fail = false 
          return 0;
        }
       }
      }
      if(this.trajectory.attempt >= 5){
        this.alerted = false
        this.idle.bool = true
        this.idle.active = false
      }
      closedSet.push(current)
      
      openSet.splice(openSet.indexOf(current),1)
      
      var neighbors = current.neighbors
      for (i=0;i<neighbors.length;i++){
         var neighbor = neighbors[i]
         if (!closedSet.includes(neighbor) && !neighbor.wall){
         neighbor.g = current.g + 1
         neighbor.f = neighbor.g + Math.abs(target.i-neighbor.i)+ Math.abs(target.j-neighbor.j)
         neighbor.previous = current
         openSet.push(neighbor)}
    }
    
    }
    }}
    // PATHFINDING - DONT CHANGE
}

class Gun{
  constructor(ctx,position,velocity,type,mag,active){
   this.ctx = ctx
   this.mag = mag
   this.position = position
   this.type = type
   this.angle = 2*Math.PI*Math.random() - Math.PI
   this.rotation = Math.PI/12
   this.velocity = velocity
   this.sizes = [
    {width:25,height:17},//PISTOL
    {width:60,height:15},// SHOTGUN
    {width:60,height:20},// MACHINE GUN
    {width:35,height:30},// SMG 
   ]
   this.size = this.sizes[this.type-1]
   if(active){
    this.active = active
   }
   else {this.active = true}
  }
  init(){
    this.update()
    this.draw()
    this.collision()
  }
  collision(){
    obstacles.forEach((obstacle)=>{
      if(Collision(this,obstacle)){
        CollisionCorrection(this,obstacle)
      }
    })
  }
  draw(){
    this.ctx.save()
    this.ctx.rect(this.position.x,this.position.y,this.size.width,this.size.height)
    this.ctx.stroke()
    this.ctx.translate(this.position.x+this.size.width/2,this.position.y+this.size.height/2)
    this.ctx.rotate(this.angle)
    this.ctx.translate(-this.size.width/2,-this.size.height/2)
    if(this.type == 1){ // PISTOL
      this.ctx.drawImage(gun,0,0,76,45,0,0,this.size.width,this.size.height)
    }
    if(this.type == 2){ // SHOTGUN
      this.ctx.drawImage(gun,0,165,140,35,0,0,this.size.width,this.size.height)
    }
    if(this.type == 3){ // MACHINE GUN
      this.ctx.drawImage(gun,0,45,150,50,0,0,this.size.width,this.size.height)
    }
    if(this.type == 4){ // SMG
      this.ctx.drawImage(gun,0,96,95,60,0,0,this.size.width,this.size.height)
    }
  
    this.ctx.restore()
  }
  update(){
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    this.angle += this.rotation
    this.rotation *= 0.8
    this.velocity.x *= 0.8
    this.velocity.y *= 0.8
  }
}
class Item{
  constructor(ctx,position,velocity,item){
    this.ctx = ctx 
    this.position = position
    this.velocity = velocity
    this.angle = Math.random()
    this.rotation = 1
    this.item = item
    if(this.item == 4){
      this.item = 3
    }
    if (this.item == 0){
      this.value = 20
    }
    if(this.item == 1){
      this.value = 30
    }
    if(this.item == 2){
      this.value = 5
    }
    if(this.item == 3){
      this.value = 20
    }
    this.value;
    this.sizes = [
      {width:15,height:15},
      {width:15,height:20},
      {width:20,height:14},
      {width:25,height:17}
    ]
    this.size = this.sizes[this.item]
    // 0 HEALTH
    // 1 LIGHT
    // 2 SHELLS
    // 3 HEAVY 
  }
  init(){
    this.draw()
    this.update()
    this.collision()
  }
  draw(){
    this.ctx.save()
    
    this.ctx.translate(this.position.x+this.size.width/2,this.position.y+this.size.height/2)
    
    this.ctx.rotate(this.angle)
    this.ctx.translate(-this.size.width/2,-this.size.height/2)
    if (this.item == 0){
      this.ctx.drawImage(item,23,31,23,18,0,0,this.size.width,this.size.height)
    }
    if(this.item == 1){
      this.ctx.drawImage(item,0,38,9,11,0,0,this.size.width,this.size.height)
    }
    if(this.item == 2){
      this.ctx.drawImage(item,0,29,16,7,0,0,this.size.width,this.size.height)
    }
    if(this.item == 3){
      this.ctx.drawImage(item,0,0,46,27,0,0,this.size.width,this.size.height)
    }
    this.ctx.restore()
  }
  collision(){
    players.forEach((player)=>{
      if(Collision(player,this)){
        if(this.item == 0 && player.health < player.healthMax){
          player.health += this.value
          noises.push(sounds.health.cloneNode())
          if(player.health > player.healthMax){
            player.health = player.healthMax
          }
          items.splice(items.indexOf(this),1)
        }
        if(this.item == 1 && player.bullets.light < player.bullets.maxLight){
          player.bullets.light += this.value
          noises.push(sounds.pickup.cloneNode())
          if(player.bullets.light > player.bullets.maxLight){
            player.bullets.light = player.bullets.maxLight
          }
          items.splice(items.indexOf(this),1)
        }
        if(this.item == 2 && player.bullets.shells < player.bullets.maxShells){
          player.bullets.shells += this.value
          noises.push(sounds.pickup.cloneNode())
          if(player.bullets.shells > player.bullets.maxShells){
            player.bullets.shells = player.bullets.maxShells
          }
          items.splice(items.indexOf(this),1)
        }
        if(this.item == 3 && player.bullets.heavy < player.bullets.maxHeavy){
          player.bullets.heavy += this.value
          noises.push(sounds.pickup.cloneNode())
          if(player.bullets.heavy > player.bullets.maxHeavy){
            player.bullets.heavy = player.bullets.maxHeavy
          }
          items.splice(items.indexOf(this),1)
        }
        
        
      }
    })
    
  }
  update(){
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
     this.velocity.x *= 0.7
     this.velocity.y *= 0.7
    this.angle += this.rotation
    this.rotation *= 0.8
  }
}
function draw(){  
  if(players.length == 0){
   gameEnded = true
  } 
    // AUDIO
    noises.forEach((noise,index)=>{
      if(Math.round(noise.duration*10) <= Math.round(noise.currentTime*10)){
        noises.splice(index,1)
        
      }
      if(noise.currentTime == 0 ){
        if(document.hasFocus() && interacted){
           noise.play()          
        }
        else {
          noises.splice(index,1)
        }
      }
    })

    // MOUSE 
    mouse.pos.y = mouse.event.y*canvas.height/rect.bottom + camera.y
    mouse.pos.x = mouse.event.x*canvas.width/rect.right   + camera.x
    ctx.save()
    // CAMERA
    {
    ctx.translate(-camera.x,-camera.y)
    }
    ctx.fillStyle = 'black'
    ctx.fillRect(0,0,canvas.width+camera.x,canvas.height+camera.y)
    ctx.fillStyle = 'white'
    
    
   
     //TILING
    
    
      ctx.globalAlpha = 0.5
      for (let i = 0;i<canvas.width+camera.x;i+= 100){
      for ( let j = 0;j <canvas.height+camera.y;j+= 100){
        ctx.drawImage(floor,i,j,100,100)
      }
    }
    ctx.globalAlpha = 1
    
   

    items.forEach((item)=>{
    item.init()
    })
    guns.forEach((gun)=>{
      gun.init()
    })
    bullets.forEach((bullet)=>{
      bullet.init()
    })
    particles.forEach((particle)=>{
      particle.init()
    })
    
    players.forEach((player)=>{
      if(player.position.x + player.size.width/2> canvas.width-50 && room <= 0){
        room++
        obstacles.length = 0
        generateMap()
        player.position.x = 25
        player.position.y = (canvas.height + worldBorder.y)/2 - player.size.height/2 - 25
      }
      if(enemies.length <= 0){
        mapLoading = true
      }
      if(room > 0 && enemies.length <= 0 && mapLoading &&(player.position.x-player.position.x%50 == 0 && (player.position.y+ 50)-(player.position.y%50)  == (canvas.height+worldBorder.y)/2 -((canvas.height+worldBorder.y)/2)%50)){
        obstacles.length = 0
        room++
        items.length = 0
        
        guns.length = 0
        if(room > 0){
          worldBorder.x = 1000*Math.random()
          worldBorder.y = 1000*Math.random()
          player.position.x = 25
          player.position.y = (canvas.height + worldBorder.y)/2 - player.size.height/2 - 25
          generateMap()
        }
        mapLoading = false
       }
       player.init()
      // PLAYER DETECTION AND SUCH
      enemies.forEach((enemy)=>{
        if(Collision(player,enemy)){
          CollisionCorrection(enemy,player)
        }
        if(enemy.inBounds){
          for (let i=0;i < obstacles.length;i++){
            if (lineRect(player,obstacles[i],enemy,false) && lineRect(player,obstacles[i],enemy,false)){
              enemy.aware = false
              if(!enemy.alerted){
                enemy.idle.bool = true
              }             
              break
            }
            if (i == obstacles.length - 1 ){
              enemy.aware = true
              enemy.alerted = true
              enemy.trajectory.attempt = 0
            }
          }
          if (enemy.aware){
          enemy.idle.bool = false 
          enemy.idle.active = false 
          enemy.angle = Math.atan2(player.position.y-enemy.position.y,player.position.x-enemy.position.x)
          enemy.trajectory.path = []
          enemy.trajectory.index = 0
        }
        else if (enemy.alerted){  
          if(!enemy.findingPath){
            enemy.pathFinding(player,enemy)
          enemy.findingPath = true
        }
        }
        else {enemy.idle.bool = true}
        }
        else {enemy.idle.bool = true;
         }
         })
    })
    obstacles.forEach((obstacle)=>{
      obstacle.init()
    })
    enemies.forEach((enemy)=>{
      enemy.init()
      enemies.forEach((enemy2)=>{
      if(Collision(enemy,enemy2) && enemy != enemy2){
        CollisionCorrection(enemy,enemy2)
      }
     })
    })
    camera.x = (Math.abs(camera.x)+camera.x)/2
    camera.y = (Math.abs(camera.y)+camera.y)/2
   //if(mapLoading){
   //  this.ctx.fillStyle = "black"
   //  this.ctx.globalAlpha = mapOpacity
   //  this.ctx.fillRect(camera.x,camera.y,canvas.width+camera.x,canvas.width+camera.y)
   //  mapOpacity += 0.5 * 30/fps
   //  if(mapOpacity >= 1){
   //    mapOpacity -= 0.5 * 30/fps
   //  }
   //}
    ctx.restore()

    /// HUD --------------------------------------
    
  { // CROSSHAIR
    ctx.save()
    ctx.beginPath()
    ctx.lineWidth = crosshairWidth
    ctx.strokeStyle = crosshairColor
    ctx.translate(mouse.event.x*canvas.width/rect.right,mouse.event.y*canvas.height/rect.bottom)
  
    ctx.moveTo(crosshairGap,0)
    ctx.lineTo(crosshairGap + crosshairSize,0)
  
    ctx.moveTo(-crosshairGap,0)
    ctx.lineTo(-crosshairSize - crosshairGap,0)
    
    ctx.moveTo(0,crosshairGap)
    ctx.lineTo(0,crosshairSize + crosshairGap)
  
    ctx.moveTo(0,-crosshairGap)
    ctx.lineTo(0,-crosshairSize - crosshairGap)
  
    ctx.stroke()
  
    ctx.closePath()
    ctx.restore()
    }
    window.onresize = resize
    /// HUD --------------------------------------

}
function lineRect(player,obstacle,enemy,bool,side){
  // (x1,y1) (x2,y2) BEING THE VISION LINE 
  // (x3,y3) LINE OF THE RECT  // x4 && y4 NOT NEEDED
  //if(side == 0){
  x1 = enemy.position.x+enemy.size.width/2
  y1 = enemy.position.y+enemy.size.height/2
  x2 = player.position.x+player.size.width/2
  y2 = player.position.y+player.size.height/2
  x3 = obstacle.position.x
  y3 = obstacle.position.y
  //}
  //if(side == 1){
  //x1 = enemy.position.x+enemy.size.width/2
  //y1 = enemy.position.y  
  //x2 = player.position.x+player.size.width/2
  //y2 = player.position.y+player.size.height/2
  //x3 = obstacle.position.x
  //y3 = obstacle.position.y
  //}
  //if(side == 2){
  //x1 = enemy.position.x+enemy.size.width
  //y1 = enemy.position.y+enemy.size.height
  //x2 = player.position.x+player.size.width/2
  //y2 = player.position.y+player.size.height/2
  //x3 = obstacle.position.x
  //y3 = obstacle.position.y
  //}
  let top = LineCollision(x1,y1,x2,y2,x3,y3,x3+obstacle.size.width,y3,bool) // TOP
  let left = LineCollision(x1,y1,x2,y2,x3,y3,x3,y3+obstacle.size.height,bool) // LEFT
  let right  = LineCollision(x1,y1,x2,y2,x3+obstacle.size.width,y3,x3+obstacle.size.width,y3+obstacle.size.height,bool) // RIGHT
  let bottom  = LineCollision(x1,y1,x2,y2,x3,y3+obstacle.size.height,x3+obstacle.size.width,y3+obstacle.size.height,bool) // BOTTOM
  
  if (!bool){
    if ( top || left || right || bottom ){
     return true
  }
  else {return false}
  }
  else {
    var intersections = [top,left,right,bottom]
    var dist = [top,left,right,bottom]
    for (let i=0;i<dist.length;i++){
       if(dist[i] == undefined){
        dist[i] = Infinity
       }
       else {
        dist[i] = Math.sqrt((x2-dist[i].x)**2+(y2-dist[i].y))
       }
    }
    let minima = 0
    for(let i = 0;i<dist.length;i++){
      if(dist[minima]>dist[i]){
        minima = i
      }
    }
    return intersections[minima]
    
  }
  
}

function LineCollision(x1,y1,x2,y2,x3,y3,x4,y4,bool){
  uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)); 
  uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  if(!bool){
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1){return true}
  else return false
  }
  else {
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1){
      var intersectionX = x1 +(uA*(x2-x1))
      var intersectionY = y1 +(uA*(y2-y1))      
    return {x:intersectionX,y:intersectionY}
    }
  }
  
}

function RectInRect(enemy,tile){
 return (enemy.position.x>tile.x-25 && enemy.position.x + enemy.size.width < tile.x-25 + tile.width
  && enemy.position.y>tile.y-25 && enemy.position.y + enemy.size.height < tile.y-25 + tile.height)
}
function Collision(player,obstacle){
  return player.position.x+player.size.width > obstacle.position.x &&(obstacle.position.x+obstacle.size.width) > player.position.x && player.position.y+player.size.height > obstacle.position.y&&obstacle.position.y+obstacle.size.height > player.position.y
  }

function CollisionCorrection(player,obstacle){
  
    if (Math.min(Math.abs(player.position.x+player.size.width-obstacle.position.x),Math.abs(player.position.x-obstacle.position.x-obstacle.size.width))
      >Math.min(Math.abs(player.position.y+player.size.height-obstacle.position.y),Math.abs(player.position.y-obstacle.position.y-obstacle.size.height) 
    ))
    {
      if (Math.abs(player.position.y + player.size.height - obstacle.position.y)>Math.abs(player.position.y - obstacle.position.y - obstacle.size.height)){
        player.position.y = obstacle.position.y + obstacle.size.height
       }
       else {player.position.y = obstacle.position.y - player.size.height;
        }
    }
    else {
      if (Math.abs(player.position.x + player.size.width - obstacle.position.x)>Math.abs(player.position.x - obstacle.position.x - obstacle.size.width)){
      player.position.x = obstacle.position.x + obstacle.size.width
      
     }
     else {player.position.x = obstacle.position.x - player.size.width;
      }
    }}
      
  
function resize(){
    rect = canvas.getBoundingClientRect()  
    document.querySelector(':root').style.setProperty('--window',Math.sqrt(innerHeight**2+innerWidth**2)/50+"px")
}

// KEYBOARD & MOUSE KEYS //
addEventListener('keydown',({keyCode})=>{
    if (keyCode == 68){keys.d.pressed = true;}
    if (keyCode == 65){keys.a.pressed = true}
    if (keyCode == 87){keys.w.pressed = true}
    if (keyCode == 83){keys.s.pressed = true}
    if (keyCode == 69){keys.e.pressed = true}
    if (keyCode == 82){keys.r.pressed = true}
})
addEventListener('keyup',({keyCode})=>{
 if (keyCode == 68){keys.d.pressed = false}
 if (keyCode == 65){keys.a.pressed = false}
 if (keyCode == 87){keys.w.pressed = false}
 if (keyCode == 83){keys.s.pressed = false}
 if (keyCode == 69){keys.e.pressed = false}
 if (keyCode == 82){keys.r.pressed = false}
})
addEventListener('mousedown',(event)=>{
  if (event.button == 0){
  mouse.left.pressed = true}
  if (event.button == 2){
    mouse.right.pressed = true
  }
  if(!interacted){
    interacted = true
  }
 })
addEventListener('mouseup',(event)=>{
    if (event.button == 0){
    mouse.left.pressed = false}
    if (event.button == 2){
      mouse.right.pressed = false
    }
  })
addEventListener('mousemove',(event)=>{
     mouse.event.x = event.x 
     mouse.event.y = event.y
  })

// GAME START 
function gameLoop(){
  // LISTEN FOR rAF STOPS

  

  // FPS COMPUTE  
  elapsedTime = performance.now() - then 
  if(timeSkip){
    elapsedTime = timeSkip - then
    timeSkip = 0
  }
  
 
  fps = Math.round(1000 / elapsedTime)
      startTime = performance.now();
      if(fps > fpsLimit){
        fps = fpsLimit
      }
      
      if (fps > fpsMax){
        fpsMax = fps
      }
      if(fpsMax > fpsLimit){
        fpsMax = fpsLimit
      } 
  if(elapsedTime > 1/fpsLimit * 1000){
       
        draw()
  } 
  then = performance.now()
  document.getElementById('fpsText').innerHTML = fps
  requestAnimationFrame(gameLoop)
}
gameLoop()
function generateMap(){
  // BORDERS (MESS TO BE IGNORED)
  {
  obstacles.push(new Obstacle(ctx,{x:0,y:0},{width:50,height:(canvas.height+worldBorder.y)/2 - ((canvas.height+worldBorder.y)/2)%50  - 50}))
   obstacles.push(new Obstacle(ctx,{x:0,y:(canvas.height+worldBorder.y)/2 - (canvas.height+worldBorder.y)/2%50},{width:50,height:canvas.height+worldBorder.y - (canvas.height+worldBorder.y)/2 + ((canvas.height+worldBorder.y)/2)%50 + 50}))

   obstacles.push(new Obstacle(ctx,{x:canvas.width+worldBorder.x-(canvas.width+worldBorder.x)%50,y:50},{width:50,height:canvas.height+worldBorder.y - 50}))
   obstacles.push(new Obstacle(ctx,{x:50,y:0},{width:canvas.width-50+worldBorder.x,height:50}))
   obstacles.push(new Obstacle(ctx,{x:50,y:canvas.height+worldBorder.y -(canvas.height+worldBorder.y )%50},{width:canvas.width-50+worldBorder.x,height:50}))
  }
   for(var j=0;j<(canvas.height+worldBorder.y - (canvas.height+worldBorder.y)%50)/250 - 1;j++){
    var wall = false
    for(var i = 0;i<(canvas.width+worldBorder.x - (canvas.width+worldBorder.x)%50)/250 - 1;i++){
      if(i == 0){
        var noEnemy = true
      }
      else {var noEnemy = false}
     if(i == 0 && j == Math.floor(((canvas.height+worldBorder.y - 125)/2 - (canvas.height+worldBorder.y - 125)%50) / 250)){
      // ENTRY 
      obstacles.push(new Obstacle(ctx,{x:i*250+150,y:j*250+100},{width:50,height:150}))
      obstacles.push(new Obstacle(ctx,{x:i*250+115,y:j*250+100},{width:35,height:35}))
      obstacles.push(new Obstacle(ctx,{x:i*250+115,y:j*250+215},{width:35,height:35}))
       continue
     }
     
      var random = Math.round(Math.random()*10)
      if(random <= 1){
        // BLANK
        if(!noEnemy){
        for(var k = 0;k<Math.round(4*Math.random());k++){
          enemies.push(new Enemy(ctx,{x:i*250+k*50 + 50,y:j*250+150},0))
        }
        continue
      }
      }
      if(random == 2){
        // PILLARS
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+50},{width:100,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+200,y:j*250+50},{width:100,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+200,y:j*250+250},{width:100,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+250},{width:100,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+100},{width:50,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+200},{width:50,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+250,y:j*250+100},{width:50,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+250,y:j*250+200},{width:50,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+150,y:j*250+150},{width:50,height:50}))
      }
      if(random == 3){
       // CROSS
      obstacles.push(new Obstacle(ctx,{x:i*250+150,y:j*250+150},{width:50,height:50}))
      obstacles.push(new Obstacle(ctx,{x:i*250+120,y:j*250+160},{width:30,height:30}))
      obstacles.push(new Obstacle(ctx,{x:i*250+200,y:j*250+160},{width:30,height:30}))
      obstacles.push(new Obstacle(ctx,{x:i*250+160,y:j*250+200},{width:30,height:30}))
      obstacles.push(new Obstacle(ctx,{x:i*250+160,y:j*250+120},{width:30,height:30}))
      if(!noEnemy){
      for(var k = 0;k<Math.round(2*Math.random());k++){
        enemies.push(new Enemy(ctx,{x:i*250+k*50 + 50,y:j*250+200},4))
      }

    }
      }
      if(random == 4){
        // GIANT PILLAR
        obstacles.push(new Obstacle(ctx,{x:i*250+100,y:j*250+100},{width:150,height:150}))
        if(Math.random()<0.5){
          items.push(new Item(ctx,{x:i*250 + 75,y:j*250+75},{x:0,y:0},0))
        }
      }
      if(random == 5){
        // OPEN ROOM
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+50 },{width:50,height:100}))
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+200},{width:50,height:100}))
        obstacles.push(new Obstacle(ctx,{x:i*250+250,y:j*250+50 },{width:50,height:100}))
        obstacles.push(new Obstacle(ctx,{x:i*250+250,y:j*250+200},{width:50,height:100}))
        obstacles.push(new Obstacle(ctx,{x:i*250+100,y:j*250+50},{width:150,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+100,y:j*250+250},{width:150,height:50}))
        if(!noEnemy){
        for(var k = 0;k<Math.round(2*Math.random());k++){
          enemies.push(new Enemy(ctx,{x:i*250+k*50 + 50,y:j*250+150},1))
        }
       
      }
      }
      if(random == 6){
        // HALL 
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+50},{width:100,height:90}))
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+210},{width:100,height:90}))
        obstacles.push(new Obstacle(ctx,{x:i*250+200,y:j*250+50},{width:100,height:90}))
        obstacles.push(new Obstacle(ctx,{x:i*250+200,y:j*250+210},{width:100,height:90}))
        obstacles.push(new Obstacle(ctx,{x:i*250+150,y:j*250+250},{width:50,height:50}))
        obstacles.push(new Obstacle(ctx,{x:i*250+150,y:j*250+50},{width:50,height:50}))
        if(!noEnemy){
          for(var k = 0;k<Math.round(3*Math.random());k++){
          enemies.push(new Enemy(ctx,{x:i*250+k*50 + 50,y:j*250+200},2))
        }
        }
        
      }
      if(random == 7 && !wall){
        // WALL
        wall = true
        obstacles.push(new Obstacle(ctx,{x:i*250+50,y:j*250+50},{width:250,height:250}))
      }
    }
      
   }
}
function entryMap(){
  obstacles.push(new Obstacle(ctx,{x:0,y:0},{width:canvas.width,height:1*canvas.height/4}))
  obstacles.push(new Obstacle(ctx,{x:0,y:3*canvas.height/4},{width:canvas.width,height:1*canvas.height/4}))
  obstacles.push(new Obstacle(ctx,{x:canvas.width-50,y:canvas.height/4},{width:50,height:100}))
  obstacles.push(new Obstacle(ctx,{x:canvas.width-50,y:3*canvas.height/4-150},{width:50,height:150}))
} 
entryMap()

players.push(new Player(ctx,{x:500,y:(canvas.height+worldBorder.y-125)*0.5}))
document.querySelector(':root').style.setProperty('--window',Math.sqrt(innerHeight**2+innerWidth**2)/50+"px")

setInterval(()=>{
  if(document.hidden){
    gamePaused = true
    if(!timeSkip){
      timeSkip = performance.now()
    }
  }
},0)



