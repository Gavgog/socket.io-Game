let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

let timeNow = 0;
let lowestID = 0;

class Player{
    constructor(IDa){
        this.id = IDa;
        this.Type = "Player";
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.shoottimer = 0;
        this.width = 30;
        this.height = 40;
        this.color = "#33aaff";
        this.equiped = null;
        this.health = 100;
    }

    updateAtributes(itemDict){
        let attributeList = Object.keys(itemDict);
        for (let a = 0; a < attributeList.length;a++){
            this[attributeList[a]] = itemDict[attributeList[a]]
        }
        this.isYou = false;
    }
}

class LocalMap{
    constructor(xPos) {
        this.Type = "LocalMap";
        this.xPos = xPos;
        this.backgroundColor = "#9CCC65";
        this.size = 1000;
        this.complexity = 10;
        this.height = 120;
    }

    drawFloor(){
        board.fillStyle = this.backgroundColor;
        board.fillRect(0,this.height + player.xPos,canvas.width,100);
    }

    draw(){
        this.drawFloor()
    }
}


class Tree{
    constructor(){
        this.Type = "Tree";
        this.id = getRandomInt(5000) + 1;
        this.xVel =  0;
        this.yVel = 0;
        this.xPos = getRandomInt(100000)-50000;
        this.yPos = 120;
        this.height = 100 + getRandomInt(100);
        this.width = this.height/5;
        this.health = 35;
        this.weight = 1;
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
    }

}

class Rock{
    constructor(){
        this.Type = "Rock";
        this.id = getRandomInt(5000) + 1;
        this.xVel =  0;
        this.yVel = 0;
        this.xPos = getRandomInt(100000)-50000;
        this.yPos = 120;
        this.height = 100 + getRandomInt(100);
        this.width = this.height/5;
        this.health = 35;
        this.weight = 1;
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
    }

}

class Game{
    constructor(){
        this.players = {};
        this.items = {};
        this.playerTimers = {};
        this.worldData = {};
        this.generateData();
    }

    generateData(){
        this.worldData[0] = new LocalMap(0);
        for (let i = 0; i < 100; i ++){
            const rock = new Rock();
            this.worldData["R"+rock.id] = rock;
        }
        for (let i = 0; i < 300; i ++){
            const tree = new Tree();
            this.worldData["T"+tree.id] = tree;
        }
    }

    updatePlayer(player){
        if (this.players[player.id]){
            this.players[player.id].updateAtributes(player);
            this.playerTimers[player.id] = 6;
        }else{
            this.addPlayer(player);
        }
    }

    addPlayer(player){
        this.players[player.id] = new Player(player.id);

        io.emit('loadIn'+player.id, this.worldData);
        //console.log("Player " + player.id + " joined");
    }

    purgeIdlePlayers(){
        let playerList = Object.keys(this.players);
        for (let i = 0; i < playerList.length; i++){
            this.playerTimers[playerList[i]] --;
            if (this.playerTimers[playerList[i]] < 0){
                this.removeUser(playerList[i])
            }
        }
    }

    removeUser(id){
        delete this.players[id];
    }

    status(){
        return;
        let playerList = Object.keys(this.players);
        console.log("players: " + playerList.length + " (" + playerList + ")")
    }
}

let game = new Game();

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/js/main.js', function(req, res){
    res.sendFile(__dirname + '/js/main.js');
});

io.on('connection', function(socket){
    socket.on('create', function(item){
        game.items[item.id] = item;
    });

    socket.on('remove', function(item){
        delete game.items[item];
    });

    socket.on('update', function(player){
        game.updatePlayer(player);
        io.emit('update'+player.id, buildDynamicList());
        printStatus();
    });
    socket.on('hit', function(itemId,amount){
        let item = getItemById(itemId);
        item.hit(amount);
    });
    socket.on('die', function(playerId){
        console.log(playerId,"Died");
        delete game.players[playerId];
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
    setInterval(mainLoop,500);
});

function mainLoop(){
    game.status();
    game.purgeIdlePlayers();
    timeNow = getTime();
}

function getTime(){
    let date = new Date();
    let result = 0;
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDay();
    let hour = date.getHours();
    let min = date.getMinutes();
    let second = date.getSeconds();
    result = year*3110400 + month*259200 + day*8640 + hour*3600 + min*60 + second;
    return result
}


function printStatus(){
    // console.clear();
    //console.log("players: " + Object.keys(game.players).length)
}


function buildDynamicList(){
    let result = [];
    let playerIds = Object.keys(game.players);
    for (let i = 0; i < playerIds.length;i ++){
        result.push(game.players[playerIds[i]]);
    }
    let items = Object.keys(game.items);
    for (let i = 0; i < items.length;i ++){
        result.push(game.items[items[i]]);
    }
    return result
}

function getRandomInt(max){
    return Math.floor(Math.random() * Math.floor(max));
}