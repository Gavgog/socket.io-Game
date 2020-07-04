let my_id = Math.round(Math.random()*100);
let frameNo = 0;

const canvas = document.getElementById("gameCanvas");
const board = canvas.getContext('2d');

let drawArrayA = [];
let drawArrayB = [];
let colorVariants = {};

const xDiff = canvas.width/2;
const yDiff = canvas.height/2;
const framerate = 60;
let game3d = false;

let timeNow = 0;
let timeSec = 0;

let gamePaused = false;
let cameraMode = "Player";
let gameComplexity = 100;
let socket = io();

let globalArray = [];
const localArray = {};
const graveYard = {};
const backgroundArray = [];

function convertToObject(itemDict){
    let converted = new DynamicObject();
    switch (itemDict.Type){
        case("backgroundObj"):
            converted = new backgroundObject(0);
            break;
        case("LocalMap"):
            converted = new LocalMap(0);
            break;
        case("Crate"):
            converted = new Crate();
            break;
        case("Bricks"):
            converted = new Bricks();
            break;
        case("Shop"):
            converted = new Shop();
            break;
        case("Tree"):
            converted = new Tree();
            break;
        case("Rock"):
            converted = new Rock();
            break;
        case("stone"):
            converted = new Stone(0,0,1);
            break;
        case("chest"):
            converted = new Chest(0,0,"block");
            break;
        case("box"):
            converted = new Box(0,0,"block");
            break;
        case("Player"):
            converted = new Player(0);
            break;
        case("Bullet"):
            converted = new bullet(0,0,0,0,0,0,0);
            break;
        case("Arrow"):
            converted = new arrow(0,0,0,0,0,0);
            break;
        case("Throwable"):
            converted = new throwable(0,0,0,0,0,0);
            break;
        case("Weapon"):
            converted = new weapon();
            break;
        case("picture"):
            converted = new Picture();
            break;
        case("imagePixel"):
            converted = new imagePixel(itemDict.xPos,itemDict.yPos,itemDict.color,itemDict.sizeX);
            break;
    }
    let attributeList = Object.keys(itemDict);
    for (let a = 0; a < attributeList.length;a++){
        if (attributeList[a].Type === "Weapon"){
            converted[attributeList[a]] = convertToObject(itemDict[attributeList[a]]);
        }else{
            converted[attributeList[a]] = itemDict[attributeList[a]];
        }
    }
    converted.isYou = false;

    return converted;
}

class GUI{
    constructor() {
        this.create();
    }
    create(){
        this.Type = "GUI";
        this.size = "Fullscreen";
        this.xPos = 0;
        this.yPos = 0;
        this.width = 0;
        this.height = 0;
        this.color = "#212121";
        this.opacity = 0.8;
        this.items = [];
        this.displaying = false;
        localArray["UI"] = this;
        this.text = "";
        this.textTimer = 5;

        this.singleGUI = null;
    }

    notify(text){
        this.text = text;
        this.textTimer = 5;
    }

    move(){

    }

    setTo(Type){
        this.type = Type;
        removeGhost();
        switch(Type){
            case("Die Screen"):
            this.singleGUI = new DeathScreen();
                break;
            case("Overlay"):
            this.singleGUI = new Overlay();
                break;
            case("Inventory"):
            this.singleGUI = new InventoryScreen();
                break;
            case("Main Menu"):
            this.singleGUI = new DeathScreen();
                break;
            case("build"):
            this.singleGUI = new BuildScreen();
                break; 
    }

    }

    display(){
        this.displaying = true;
    }
    hide(){
        this.displaying = false;
    }
    draw(){
        if (!this.displaying) return;
        board.fillStyle = this.color;
        board.globalAlpha = this.opacity;
        if (this.size === "Fullscreen"){
            this.xPos = 0;
            this.yPos = 0;
            this.width = canvas.width;
            this.height = canvas.height;
        }else if (this.size === "Corner"){
            this.xPos = 25;
            this.yPos = 25;
            this.width = 150;
            this.height = 10 + this.items.length * 20;
        }else{
            this.xPos = 100;
            this.yPos = 100;
            this.width = canvas.width-200;
            this.height = canvas.height-200;
            board.fillRect(100,100,canvas.width-200,canvas.height-200);
        }
        board.fillRect(this.xPos, this.yPos, this.width, this.height);

        if(this.hovered()) keyboard.overMenu = true;
        else keyboard.overMenu = false;

        board.globalAlpha = 1;
        for (const item of this.items){
            item.draw();
        }


        if (this.text && this.textTimer > 0){
            board.globalAlpha = this.textTimer/5;
            board.fillStyle = "#000";
            board.font = "33px vt323";
            board.textAlign = "center";
            board.fillText(this.text,canvas.width/2,150 + this.textTimer*2,140);
            board.fillStyle = "#fff";
            board.fillText(this.text,canvas.width/2 - 2,148 + this.textTimer*2,140);

        }
        board.globalAlpha = 1;
        this.textTimer = Math.max(0,this.textTimer -0.1);
        this.drawExtra();
    }
    drawExtra(){

    }
    hovered(){
        const x = keyboard.mouseX;
        const y = keyboard.mouseY;
        if(x > this.xPos && x < this.xPos + this.width){
            if (y > this.yPos && y < this.yPos + this.height){
                return true;
            }
        }
        return false;
    }
}

class Overlay extends GUI{
    constructor(){
        super();
        this.create();
        this.size = "Corner";
        this.name = "Overlay";
        this.opacity = 0.5;
        new Button(35,30,"#e0e0e0",this,200,40,"Build","#FFEE58","build");
        new Button(35,70,"#e0e0e0",this,200,40,"Inventory","#FFEE58","Inventory");
        new Button(35,110,"#e0e0e0",this,200,40,"Skills","#FFEE58","Skills");
        new Button(35,150,"#e0e0e0",this,200,40,"FullScreen","#FFEE58","FullScreen");
        this.nextTo = "";
        this.selected = undefined;
    }

    drawExtra(){
        board.globalAlpha = 0.7;
        board.fillStyle = "#424242";
        board.fillRect(0,canvas.height - 70,150,70);
        board.fillRect(150,canvas.height - 50,canvas.width-300,50);
        board.fillRect(canvas.width-150,canvas.height - 70,canvas.width,70);

        board.globalAlpha = 0.2;
        board.fillStyle = "#689F38";
        const width = 150-(player.equiped.cooling*150/player.equiped.reloadSpeed);
        board.fillRect(0,canvas.height - 70,width,70);
        board.globalAlpha = 0.7;
        board.fillStyle = "#8BC34A";
        for (let x = 0; x < 150; x += 20){
            board.fillRect(x,canvas.height - 70,1,70);
        }

        board.globalAlpha = 1;
        board.fillStyle = "#AED581";
        for (let x = 0; x <= width; x += 5){
            const height = Math.min(x*x / 350 , 70);
            board.fillRect(x-4,canvas.height - height,3,height);
        }



        const width2 = 150-(player.chopTimer*150/player.chopMax);
        board.globalAlpha = 0.2;
        board.fillStyle = "#29B6F6";
        board.fillRect(canvas.width - 150,canvas.height - 70,width2,70);
        board.globalAlpha = 0.7;
        board.fillStyle = "#03A9F4";
        for (let x = 0; x < 150; x += 20){
            board.fillRect(canvas.width + x - 150,canvas.height - 70,1,70);
        }

        board.globalAlpha = 1;
        board.fillStyle = "#4FC3F7";
        for (let x = 0; x <= width2; x += 5){
            const height = Math.min(Math.sin(x*5 - 1.5)*15 + 25, 70);
            board.fillRect(canvas.width + x-1 - 150,canvas.height - height,3,height);
        }


        board.textAlign = "left";
        board.fillStyle = "#ffffff";
        board.font = "52px vt323";
        board.fillText(player.equiped.name,5,canvas.height-20,140);
        board.fillText(this.nextTo,canvas.width - 145,canvas.height-20,140);

    }
}

class DeathScreen extends GUI{
    constructor(){
        super();
        this.create();
        this.name = "Death Screen";
        new Title(canvas.width/2,150,"#ffffff",this,"You Died");
        new Button(canvas.width/2 - 100,canvas.height/2,"#e0e0e0",this,200,50,"Respawn","#FFEB3B","Respawn");
    }
}

class BuildScreen extends GUI{
    constructor(){
        super();
        this.create();
        this.name = "Build";
        // new Label(canvas.width/2,90,"#ffffff",this,"Building: Crate " ,42);
        localArray["Ghost"] = new GhostObject("crate");
        this.opacity = 0.5;
        this.size = "Corner";
        new Button(35,35,"#e0e0e0",this,200,40,"Exit","#FFEE58","return");
        this.selected = "Crate";
        this.type = "build";
    }

    drawExtra(){
        
        const thingsToBuild = [["Crate","#795548","10 wood"],["Bricks","#424242","10 stone"],["Shop","#ef5350","10 stone + 10 wood"]];
        board.globalAlpha = 0.5;
        board.fillStyle = "#37474F";
        board.fillRect(50,canvas.height - 150,thingsToBuild.length * 100,100);
        board.globalAlpha = 1;
        board.textAlign = "center";
        let x = 0;
        for (const thing of thingsToBuild){
            board.globalAlpha = 0.5;
            board.fillStyle = "#757575";
            board.fillRect(x+60,canvas.height - 140 ,80,80);

            board.globalAlpha = 1;
            board.fillStyle = thing[1];


            if (keyboard.mouseX > x+60 && keyboard.mouseX < x+140){
                if(keyboard.mouseY > canvas.height - 140 && keyboard.mouseY < canvas.height - 60) {
                    if(keyboard.click){
                        this.selected = thing[0];
                    }

                    board.fillRect(x+60,canvas.height - 68,80,8);
                    board.fillRect(x+132,canvas.height - 140,8,80);
                    board.fillRect(x+60,canvas.height - 140,8,80);
                }
            }

            if (thing[0] === this.selected){
                board.fillRect(x+60,canvas.height - 140,80,80);
            }else{
                board.fillRect(x+60,canvas.height - 140,80,8);
            }

            board.fillStyle = "#fff";
            board.font = 32+"px VT323";
            board.fillText(thing[0],x+100,canvas.height-105,70);
            board.font = 16+"px VT323";
            board.fillText(thing[2],x+100,canvas.height-75,70);
            x += 100;
        }
        if (localArray['UI'].type === "build"){
        localArray["Ghost"] = new GhostObject(this.selected);
        }
        board.fillStyle = "#fff";
        board.font = 42+"px VT323";
        board.fillText("Building: " + this.selected,canvas.width/2,90);
    }
}

function removeGhost(){
    if (!localArray["Ghost"]) return
    const secondId = localArray["Ghost"].id;
    delete localArray["Ghost"];
    delete localArray[secondId];
}

class InventoryScreen extends GUI{
    constructor(){
        super();
        this.create();
        this.name = "Inventory";
        new Label(canvas.width/2,90,"#ffffff",this,"Inventory" ,42);
        this.opacity = 0.8;
        this.size = "Fullscreen";
        new Button(canvas.width-135,30,"#FF8A65",this,100,100,"X","#F4511E","return");
        this.selected = undefined;
    }

    drawExtra(){
        let inventory = player.inventory;
        const fitWidth = Math.round((canvas.width - 500)/70);
        let selected = null;
        let hoverX = undefined;
        let hoverY = undefined;
        let hoverName = undefined;
        for(let i = 0; i < inventory.length; i ++){
            const x = i%fitWidth;
            const y = Math.floor(i/fitWidth);
            let color = "#757575";
            board.fillStyle = "#757575";
            if(keyboard.mouseX > 100+x*70 && keyboard.mouseX < 160+x*70){
                if(keyboard.mouseY > 150 + y * 70 && keyboard.mouseY < 210 + y * 70){
                    hoverX = x;
                    hoverY = y;
                    hoverName = inventory[i];
                    color = "#03A9F4";
                    if(keyboard.click){
                        color = "#64B5F6";
                        this.selected = inventory[i];
                    }
                }
            }
            board.fillStyle = color;
            board.textAlign = "left";
            board.fillRect(100+x*70,150 + y * 70,60,60);
            board.fillStyle = "#eee";
            board.font = 45+"px VT323";
            board.fillText(inventory[i].name[0].toUpperCase(),102+x*70,205 + y * 70);
            board.font = 14+"px VT323";
            board.fillText(inventory[i].name.slice(1),120+x*70,205 + y * 70,35);
        }
        board.textAlign = "left";
        board.font = 30+"px VT323";
        if ((hoverX || hoverX === 0) && (hoverY || hoverY === 0) && hoverName){
            board.globalAlpha = 0.9;
            board.fillStyle = "#212121";
            board.fillRect(keyboard.mouseX,keyboard.mouseY,hoverName.name.length * 20,30);
            board.fillStyle = "#757575";
            board.fillRect(keyboard.mouseX,keyboard.mouseY,5,30);
            board.globalAlpha = 1;
            board.fillStyle = "#eee";
            board.fillText(hoverName.name,keyboard.mouseX + 10,keyboard.mouseY + 24);
        }

        if (this.selected)this.drawStats()
    }

    drawStats(){
        
        const color = "#64DD17";
        const colorL = "#76FF03";
        board.globalAlpha = 0.8;
        board.fillStyle = "#212121";

        board.fillRect(canvas.width - 395,155,5,canvas.height - 300);
        board.fillRect(canvas.width - 95,155,5,canvas.height - 300);
        board.fillRect(canvas.width - 395,canvas.height - 145,305,5);
        board.fillRect(canvas.width - 395,155,20,5);
        board.fillText(this.selected.name,canvas.width - 370,165);
        const length = 265 - (this.selected.name.length * 12);
        board.fillRect(canvas.width - length-95,155,length ,5);
        board.globalAlpha = 1;

        board.fillStyle = color;
        board.fillRect(canvas.width - 400,150,5,canvas.height - 300);
        board.fillRect(canvas.width - 100,150,5,canvas.height - 300);
        board.fillRect(canvas.width - 400,canvas.height - 150,305,5);
        board.fillRect(canvas.width - 400,150,20,5);
        board.fillText(this.selected.name,canvas.width - 375,160);
        board.fillRect(canvas.width - length-100,150,length ,5);

        board.fillStyle = "#BDBDBD";
        if (this.selected.stackable){
            board.fillText(this.selected.description, canvas.width - 380, 210,250);
            board.fillText("Value: " + this.selected.value, canvas.width - 380, 260);
            board.fillText("Quantity: " + this.selected.amount, canvas.width - 380, 310);
        }else {
            board.fillText("Weapon Type: " + this.selected.amunitionType, canvas.width - 380, 210);
            board.fillText("Damage: " + Math.round(this.selected.damage * 10) / 10, canvas.width - 380, 260);
            board.fillText("Fire rate: " + Math.round(10 / this.selected.reloadSpeed), canvas.width - 380, 310);
            board.fillText("Range: " + Math.round(this.selected.bulletVelocity * 200) / 10, canvas.width - 380, 360);
        }


        if (this.selected.stackable) return;
        let hovered = false;
        if(keyboard.mouseX > canvas.width - 385 && keyboard.mouseX < canvas.width - 110){
            if(keyboard.mouseY > canvas.height - 200 && keyboard.mouseY < canvas.height - 160){
                hovered = true;
            }
        }

        if(!(hovered && keyboard.click)) {
            board.fillStyle = "#212121";
            board.fillRect(canvas.width - 380, canvas.height - 195, 275, 40);
        }else{
            player.equiped = this.selected;
            localArray['UI'].setTo("Overlay");
            localArray['UI'].display();
        }

        if (!hovered){
            board.fillStyle = color;
        } else {
            board.fillStyle = colorL;
        }


        board.fillRect(canvas.width - 385,canvas.height - 200,275,40);
        board.textAlign = "center";
        board.fillStyle = "#212121";
        if(deepEquals(this.selected,player.equiped)){
            board.fillText("Equipped",canvas.width - 240,canvas.height - 173);
        }else{
            board.fillText("Equip",canvas.width - 240,canvas.height - 173);
        }

    }
}

class GuiItem{
    constructor(x,y,color,parent,width,height){
        this.Type = "GUII";
        this.GType = "Generic";
        this.xPos = x;
        this.yPos = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.center = true;
        this.parent = parent;
        this.parent.items.push(this);
    }

    draw(){
        board.fillStyle = this.color;
        board.fillRect(this.xPos,this.yPos,this.width,this.height);
    }
}

class Title extends GuiItem{
    constructor(x,y,color,parent, text){
        super(x,y,color,parent);
        this.text = text;
        this.size = 100;
        this.center = true;
        this.parent = parent;
        this.parent.items.push(this);
    }

    draw(){
        board.fillStyle = this.color;
        board.textAlign = "center";
        board.font = this.size+"px VT323";
        board.fillText(this.text,this.xPos,this.yPos,canvas.width-this.xPos);
    }
}

class Label extends GuiItem{
    constructor(x,y,color,parent, text,size){
        super(x,y,color,parent);
        this.text = text;
        this.size = size;
        this.center = true;
        this.parent = parent;
        this.parent.items.push(this);
    }

    draw(){
        board.textAlign = "center";
        board.font = this.size+"px VT323";
        board.fillStyle = "#000";
        board.globalAlpha = 0.3;
        board.fillText(this.text,this.xPos+2,this.yPos+2,canvas.width-this.xPos);
        board.globalAlpha = 1;
        board.fillStyle = this.color;
        board.fillText(this.text,this.xPos,this.yPos,canvas.width-this.xPos);
    }
}

function windowSize(size) {
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    if (size === "FullScreen"){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else if (size === "Standard"){
        canvas.width = 800;
        canvas.height = 600;
    }else if (size === "Wide"){
        canvas.width = 1000;
        canvas.height = 600;
    }else if (size === "XWide"){
        canvas.width = 1200;
        canvas.height = 600;
    }
    else if (size === "SWide"){
        canvas.width = 1500;
        canvas.height = 600;
    }
}

class Button extends GuiItem{
    constructor(x,y,color,parent,width,height, text, textColor,call){
        super(x,y,color,parent,width,height);
        this.text = text;
        this.textColor = textColor;
        this.size = 0.7*this.height;
        this.center = true;
        this.parent = parent;
        this.call = call;
        this.parent.items.push(this);
    }

    hovered(){
        const x = keyboard.mouseX;
        const y = keyboard.mouseY;
        if(x > this.xPos && x < this.xPos + this.width){
            if (y > this.yPos && y < this.yPos + this.height){
                return true;
            }
        }
        return false;
    }

    draw(){
        board.fillStyle = "#e1e1e1";
        // board.fillRect(this.xPos,this.yPos,this.width,this.height);
        board.textAlign = "center";
        board.font = this.size+"px VT323";
        let xpos = this.xPos+this.width/2;

        if (this.parent.size === "Corner"){
            xpos = this.xPos;
            board.textAlign = "left";
        }

        if (this.hovered()) {
            board.fillStyle = "#000";
            if (this.parent.size === "Corner"){
                board.fillText(">"+this.text,xpos + 2,this.yPos+(this.height*2)/3 + 2,canvas.width-this.xPos);
                board.fillStyle = this.textColor;
                board.fillText(">"+this.text,xpos,this.yPos+(this.height*2)/3,canvas.width-this.xPos);
            }else{
                board.fillText("-"+this.text+"-",xpos + 2,this.yPos+(this.height*2)/3 + 2,canvas.width-this.xPos);
                board.fillStyle = this.textColor;
                board.fillText("-"+this.text+"-",xpos,this.yPos+(this.height*2)/3,canvas.width-this.xPos);
            }
            if (keyboard.isClicked())this.click();
        } else {
            board.fillStyle = "#000";
            board.fillText(this.text,xpos+2,this.yPos+(this.height*2)/3+2,canvas.width-this.xPos);
            board.fillStyle = this.color;
            board.fillText(this.text,xpos,this.yPos+(this.height*2)/3,canvas.width-this.xPos);
        }
    }

    click(){
        switch(this.call){
            case("Respawn"):
                player.respawn();
                localArray["UI"].setTo("Overlay");
                localArray["UI"].display();
                break;
            case("Inventory"):
                localArray["UI"].setTo("Inventory");
                localArray["UI"].display();
                break;
            case("build"):
                localArray["UI"].setTo("build");
                localArray["UI"].display();
                break;
            case("return"):
                localArray["UI"].setTo("Overlay");
                localArray["UI"].display();
                removeGhost();
                break;
            case("FullScreen"):
                windowSize("FullScreen");
                break;

        }
    }

}

class Game{
    constructor(){
        this.map = null;
    }
}

class DynamicObject{
    constructor(){
        this.Type = "Generic";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.width = 30;
        this.height = 40;
        this.weight = 1;
        this.color = "#33aaff";
        this.bounce = 0.25;

        this.makeId();
    }

    displayText(text){
        this.text = text;
        this.textTimer = 5;
    }

    makeId(){
        //find a unique objectID
        let idTaken = true;
        while (idTaken){
            idTaken = false;
            this.id ++;
            for (const item of globalArray){
                if (item.id === this.id){
                    idTaken = true;
                    break;
                }
            }
        }
    }

    bulletCollision(){
        for (const key of Object.keys(localArray)){
            const item = localArray[key];
            if (!item) continue;
            if(item.Type === "Bullet" || item.Type === "Arrow"|| item.Type === "Throwable"){
                if (this.isYou){
                    if (collide(this,item) && item.creatorId !== my_id){
                        this.hit(item,key);
                    }
                }else{
                    if (collide(this,item)  && item.creatorId !== this.id){
                        this.hit(item,key);
                    }
                }
            }
        }
    }

    boxCollision(){
        const result = [];
        for (const key of Object.keys(localArray)){
            const item = localArray[key];
            if (!item) continue;
            if(item.Type === "Crate" || item.Type === "Bricks"){
                if (collide(this,item) && item.creatorId !== my_id){
                    result.push(item);
                }
            }
        }
        if (result.length>0) return result;
        return false;
    }

    hit(item,key){}

    momentum(){

        if (Math.abs(this.xVel) > 0.1) {
            this.xVel = this.xVel / (1 + this.weight*0.1);
        } else if (this.xVel !== 0) {
            this.xVel = 0;
        }

        this.yVel += 0.45;
        if (this.yPos+this.height > 120){

            if (this.Type !== "Player"){
                if (Math.abs(this.xVel) > 0.1 ) {
                    this.xVel = this.xVel / (1 + this.weight*5);
                } else if (this.xVel !== 0) {
                    this.xVel = 0;
                }

                this.yVel = -this.yVel*this.bounce;
                if (this.yVel < 0.1){
                    this.yPos = 120-this.height;
                }
            }else{
                this.yPos = 120-this.height;
                this.yVel = 0;
            }
        }

        if (this.Type === "Player"){
            this.xPos += this.xVel;
            this.yPos += this.yVel;

            //potentially make this return a list of boxes it collides with and itterate over them
            //check if all colliding objects are below and if so ignore side collisions
            const colls = this.boxCollision();
            if (colls){
                for (const item of colls){
                    this.colliding = false;
                    if (this.yPos + this.height <= item.yPos+item.height*0.2){
                        this.yVel = 0;
                        this.yPos = item.yPos - this.height;
                        this.colliding = true;
                    }else if (this.yPos >= item.yPos+item.height*0.6){
                        this.yVel = 0;
                        this.yPos = item.yPos + item.height;
                    }

                    if (this.xPos + this.width <= item.xPos+item.width*0.2){
                        if (this.colliding) {
                            this.colliding = false;
                        }else{
                            this.xVel = 0;
                            this.xPos = item.xPos - this.width;
                        }

                    }else if (this.xPos >= item.xPos+item.width*0.8){
                        if (this.colliding) {
                            this.colliding = false;
                        }else{
                            this.xVel = 0;
                            this.xPos = item.xPos + this.width;
                        }
                    }
                }
            }else{
                this.colliding = false;
            }

        }else{
            this.xPos += this.xVel;
            this.yPos += this.yVel;
        }

    }
    move(){
        this.momentum();
    }

    draw(){
        board.fillStyle = this.color;
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);
    }
}

class Rock extends DynamicObject{
    constructor(){
        super();
        this.Type = "Rock";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.height = 200;
        this.width = this.height/8;
        this.health = 35;
        this.weight = 1;
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
        this.makeId();
        this.parts = [];
    }

    move(){
        this.width = this.height/10;
        //if (!timeNow%10)this.height += 5;
        if (this.textTimer){this.textTimer --;}
    }

    draw() {
        board.fillStyle = "#9E9E9E";
        board.fillRect(this.xPos + camera.xPos -35, this.yPos + camera.yPos - 45, 45, 45);
        board.fillStyle = "#757575";
        board.fillRect(this.xPos + camera.xPos-15, this.yPos + camera.yPos - 10, 10, 10);
        board.fillStyle = "#9E9E9E";
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos - 30, 30, 30);


        board.fillStyle = "#424242";
        board.fillRect(this.xPos + camera.xPos -30, this.yPos + camera.yPos - 14, 18, 14);
        board.fillStyle = "#9E9E9E";
        board.fillRect(this.xPos + camera.xPos + 14, this.yPos + camera.yPos - 20, 20, 20);
        board.fillStyle = "#616161";
        board.fillRect(this.xPos + camera.xPos -2, this.yPos + camera.yPos - 35, 35, 35);

        board.fillStyle = "#9E9E9E";
        board.fillRect(this.xPos + camera.xPos -35, this.yPos + camera.yPos - 12, 18, 12);
        board.fillStyle = "#9E9E9E";
        board.fillRect(this.xPos + camera.xPos + 14, this.yPos + camera.yPos - 5, 8, 5);
        board.fillRect(this.xPos + camera.xPos - 14, this.yPos + camera.yPos - 5, 8, 5);
        board.fillStyle = "#424242";
        board.fillRect(this.xPos + camera.xPos +25, this.yPos + camera.yPos - 12, 10, 12);


        board.fillStyle = "#000";
        board.font = "25px vt323";
        board.textAlign = "center";
        if (this.text && this.textTimer > 0){
            board.fillText(this.text,this.xPos + camera.xPos,this.yPos + camera.yPos - this.height * 0.5 + Math.sin(timeSec*0.002)*6,140);
        }else{
            this.text = undefined;
            this.textTimer = 0;
        }

    }

}

class Tree extends DynamicObject{
    constructor(){
        super();
        this.Type = "Tree";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.height = 200;
        this.width = this.height/8;
        this.health = 35;
        this.weight = 1;
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
        this.makeId();
    }

    move(){
        this.width = this.height/10;
        //if (!timeNow%10)this.height += 5;
        if (this.textTimer){this.textTimer --;}
    }

    draw() {
        board.fillStyle = "#5D4037";
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos - this.height, this.width, this.height);

        board.fillStyle = "#1B5E20";
        board.beginPath();
        board.moveTo(this.xPos + camera.xPos - 5, this.yPos + camera.yPos - this.height*0.6);
        board.lineTo(this.xPos + camera.xPos + this.width + 5, this.yPos + camera.yPos - this.height*0.6);
        board.lineTo(this.xPos + camera.xPos + (this.width * 4) + 5, this.yPos + camera.yPos - this.height*0.2);
        board.lineTo(this.xPos + camera.xPos - (this.width * 3) - 5, this.yPos + camera.yPos - this.height*0.2);
        board.closePath();
        board.stroke();
        board.fill();

        board.fillStyle = "#2E7D32";
        board.beginPath();
        board.moveTo(this.xPos + camera.xPos - 5, this.yPos + camera.yPos - this.height*0.9);
        board.lineTo(this.xPos + camera.xPos + this.width + 5, this.yPos + camera.yPos - this.height*0.9);
        board.lineTo(this.xPos + camera.xPos + (this.width * 3.5) + 5, this.yPos + camera.yPos - this.height*0.5);
        board.lineTo(this.xPos + camera.xPos - (this.width * 2.5) - 5, this.yPos + camera.yPos - this.height*0.5);
        board.closePath();
        board.stroke();
        board.fill();

        board.fillStyle = "#388E3C";
        board.beginPath();
        board.moveTo(this.xPos + camera.xPos - 5, this.yPos + camera.yPos - this.height*1.1);
        board.lineTo(this.xPos + camera.xPos +this.width+ 5, this.yPos + camera.yPos - this.height*1.1);
        board.lineTo(this.xPos + camera.xPos +(this.width * 3) + 5, this.yPos + camera.yPos - this.height*0.8);
        board.lineTo(this.xPos + camera.xPos -(this.width * 2) - 5, this.yPos + camera.yPos - this.height*0.8);
        board.closePath();
        board.stroke();
        board.fill();

        board.fillStyle = "#43A047";
        board.beginPath();
        board.moveTo(this.xPos + camera.xPos + this.width*0.5, this.yPos + camera.yPos - this.height*1.3);
        board.lineTo(this.xPos + camera.xPos +(this.width * 2) + 5, this.yPos + camera.yPos - this.height*1.1);
        board.lineTo(this.xPos + camera.xPos -(this.width * 1) - 5, this.yPos + camera.yPos - this.height*1.1);
        board.closePath();
        board.stroke();
        board.fill();

        board.fillStyle = "#000";
        board.font = "25px vt323";
        board.textAlign = "center";
        if (this.text && this.textTimer > 0){
            board.fillText(this.text,this.xPos + camera.xPos,this.yPos + camera.yPos - this.height * 0.5 + Math.sin(timeSec*0.002)*6,140);
        }else{
            this.text = undefined;
            this.textTimer = 0;
        }

    }

}

class Crate extends DynamicObject{
    constructor(){
        super();
        this.Type = "Crate";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.width = 20;
        this.height = 20;
        this.health = 35;
        this.weight = 1;
        this.color = "#8D6E63";
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
        this.makeId();
    }

    move(){
        this.bulletCollision();
    }

    hit(bullet,id){
        if (bullet.damage) this.health -= bullet.damage;
        delete localArray[id];
        socket.emit("remove", id);
        if (this.health < 0){
            delete localArray[this.id];
            socket.emit("remove", this.id);
        }
    }

    draw(){
        board.fillStyle = this.color;
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);

        board.fillStyle = "#5D4037";
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, 2, this.height);
        board.fillRect(this.xPos + camera.xPos + 18, this.yPos + camera.yPos, 2, this.height);
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, 2);
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos + 18, this.width, 2);

        board.fillStyle = "#795548";
        if (this.skin === 1){
            for (let i = 2; i < 18; i += 2){
                board.fillRect(this.xPos + camera.xPos + i, this.yPos + camera.yPos + (18-i), 2, 2);
            }
        } else{
            for (let i = 2; i < 18; i += 2){
                board.fillRect(this.xPos + camera.xPos + i, this.yPos + camera.yPos + i, 2, 2);
            }
        }
    }
}

class Bricks extends Crate{
    constructor(){
        super();
        this.Type = "Bricks";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.width = 20;
        this.height = 20;
        this.health = 50;
        this.weight = 1;
        this.color = "#8D6E63";
        this.bounce = 0.0;
        this.skin = getRandomInt(2);
        this.makeId();
    }

    draw(){
        board.fillStyle = "#616161";
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);

        board.fillStyle = "#424242";
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, 2, this.height);
        board.fillRect(this.xPos + camera.xPos + 18, this.yPos + camera.yPos, 2, this.height);
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, 2);
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos + 18, this.width, 2);

    }
}

class Shop extends Crate{
    constructor(){
        super();
        this.Type = "Shop";
        this.id = getRandomInt(5000);
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.width = 100;
        this.height = 60;
        this.weight = 1;
        this.color = "#8D6E63";
        this.bounce = 0.0;
        this.makeId();
        this.level = 1;
    }

    displayText(text){
        this.text = text;
        this.textTimer = 5;
    }

    draw(){
        if (this.level === 1){
            board.fillStyle = "#795548";
            board.fillRect(this.xPos + camera.xPos + 1, this.yPos + camera.yPos  + 40, this.width - 2, 20);
            board.fillStyle = "#4E342E";
            board.fillRect(this.xPos + camera.xPos + 1, this.yPos + camera.yPos  + 37, this.width - 2, 3);

            board.fillStyle = "#8D6E63";
            board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, 10, this.height);
            board.fillRect(this.xPos + camera.xPos + this.width - 10, this.yPos + camera.yPos, 10, this.height);

            board.fillStyle = "#FAFAFA";
            board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, 10, 20);
            board.fillRect(this.xPos + camera.xPos + 20, this.yPos + camera.yPos, 10, 20);
            board.fillRect(this.xPos + camera.xPos + 40, this.yPos + camera.yPos, 10, 20);
            board.fillRect(this.xPos + camera.xPos + 60, this.yPos + camera.yPos, 10, 20);
            board.fillRect(this.xPos + camera.xPos + 80, this.yPos + camera.yPos, 10, 20);

            board.fillStyle = "#f44336";
            board.fillRect(this.xPos + camera.xPos + 10, this.yPos + camera.yPos, 10, 15);
            board.fillRect(this.xPos + camera.xPos + 30, this.yPos + camera.yPos, 10, 15);
            board.fillRect(this.xPos + camera.xPos + 50, this.yPos + camera.yPos, 10, 15);
            board.fillRect(this.xPos + camera.xPos + 70, this.yPos + camera.yPos, 10, 15);
            board.fillRect(this.xPos + camera.xPos + 90, this.yPos + camera.yPos, 10, 15);

            board.fillStyle = "#D7CCC8";
            board.textAlign = "center";
            board.font = "18px vt323";
            board.fillText("Shope",this.xPos + camera.xPos + this.width/2,this.yPos + camera.yPos + 53);

            board.fillStyle = "#000";
            board.font = "25px vt323";
            board.textAlign = "center";
            if (this.text && this.textTimer > 0){
                board.fillText(this.text,this.xPos + camera.xPos + this.width/2,this.yPos + camera.yPos - this.height * 0.5 + Math.sin(timeSec*0.002)*6,140);
            }else{
                this.text = undefined;
                this.textTimer = 0;
            }
            this.textTimer --;
        }
    }
}

class GhostObject extends DynamicObject{
    constructor(obj){
        super();
        this.color = "#00ff00";
        this.xPos = 0;
        this.yPos = 0;
        this.width = 20;
        this.height = 20;
        this.objectName = obj;
        this.object = this.getObject();
        this.isGhost = true;
    }

    move(){
        this.width = this.object.width;
        this.height = this.object.height;

        this.xPos = Math.round((keyboard.mouseX - 10 - camera.xPos)/20)*20;
        this.yPos = Math.round((keyboard.mouseY - 10 - camera.yPos)/20)*20;

        if (!keyboard.overMenu) {
            if (keyboard.isClicked() && !this.collides()) {
                this.create()
            }
        }
    }

    getObject(){
        let crate = new Crate();
        if(this.objectName === "Shop") {
            crate = new Shop();
        }else if(this.objectName === "Bricks"){
            crate = new Bricks();
        }
        return crate;
    }

    create(){
        const crate = this.object;
        crate.xPos = this.xPos;
        crate.yPos = this.yPos;
        localArray[crate.id] = crate;
        socket.emit("create", crate);
    }

    collides(){
        for (const item of globalArray){
            if (collide(this,item)){
                return true;
            }
        }
        for (const key of Object.keys(localArray)){
            const item = localArray[key];
            if (collide(this,item)){
                if (["GUI","cloud","LocalMap","Background"].includes(item.type) && this !== item){
                    return true;
               }
            }
        }
        if(this.yPos > 100) return true;

        return false;
    }

    draw(){
        board.globalAlpha = 0.3;
        if (!this.collides()){
            board.fillStyle = this.color;
        }else{
            board.fillStyle = "#ff0000";
        }

        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);

        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width/10, this.height);
        board.fillRect(this.xPos + camera.xPos+ this.width*0.9, this.yPos + camera.yPos, this.width/10, this.height);

        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height/10);
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos + this.height*0.9, this.width, this.height/10);
        board.globalAlpha = 1;
    }

}

class bullet extends DynamicObject{
    constructor(x,y,xVel,yVel,direction,creatorId,damage,velocity){
        super();
        this.color = "#FFF176";
        this.xVel = xVel + 10 * Math.cos(direction) * velocity;
        this.yVel = yVel + 10 * Math.sin(direction) * velocity;
        this.Type = "Bullet";
        this.xPos = x;
        this.yPos = y;
        this.weight = 0.1;
        this.width = 20;
        this.height = 2;
        this.life = 5;
        this.makeId();
        this.creatorId = creatorId;

        this.damage = damage;
    }

     move(){
        if (this.xVel !== 0 && this.yVel !== 0){
            this.life = 20;
        } else {
            this.life --;
            if (this.life < 0) this.kill();
        }
        this.momentum();
     }

     kill(){
        
        delete localArray[this.id];
        kill(this.id)
        socket.emit('remove', this.id);
     }

    draw(){
        //this.width = this.xVel*10 + this.yVel*10;
        board.save();
        board.translate((this.xPos + camera.xPos + this.width), (this.yPos + camera.yPos));

        board.rotate(this.dir);

        board.translate(-(this.xPos + camera.xPos + this.width), -(this.yPos + camera.yPos));

        board.fillStyle = this.color;
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);
        board.fillRect(this.xPos + camera.xPos- +this.width, this.yPos + camera.yPos + this.height*0.3, this.width*1.1, this.height/2);

        // board.fillStyle = "#000000";
        // board.fillRect(this.xPos + camera.xPos + this.width, this.yPos + camera.yPos, this.height, this.height);

        board.restore();
        this.dir = Math.atan2(this.yVel,this.xVel);
    }
}

class arrow extends bullet{
    constructor(x,y,xVel,yVel,direction,creatorId,damage,velocity){
        super();
        this.color = "#ffbd66";
        this.dir = direction;
        this.xVel = xVel + 20 * Math.cos(direction) * velocity;
        this.yVel = yVel + 20 * Math.sin(direction) * velocity;
        this.bounce = 0;
        this.Type = "Arrow";
        this.xPos = x;
        this.yPos = y;
        this.weight = 0.1;
        this.width = 15;
        this.height = 3;
        this.life = 5;
        this.makeId();
        this.creatorId = creatorId;

        this.damage = damage;
    }

    move(){
        if (this.yPos  > 120){
            this.kill();
        }
        if (this.xVel !== 0 && this.yVel !== 0){
            this.life = 20;
        } else {
            this.life --;
            if (this.life < 0) this.kill();
        }
        this.momentum();
    }


    draw(){
        board.save();
        board.translate((this.xPos + camera.xPos + this.width), (this.yPos + camera.yPos));

        board.rotate(this.dir);

        board.translate(-(this.xPos + camera.xPos + this.width), -(this.yPos + camera.yPos));

        board.fillStyle = this.color;
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);

        board.fillStyle = "#000";
        board.fillRect(this.xPos + camera.xPos + this.width, this.yPos + camera.yPos, this.height, this.height);

        board.restore();
        this.dir = Math.atan2(this.yVel,this.xVel);
    }
}

class throwable extends bullet {
    constructor(x, y, xVel, yVel, direction, creatorId, damage, velocity) {
        super();
        this.color = "#000";
        this.xVel = xVel + 10 * Math.cos(direction);
        this.yVel = yVel + 10 * Math.sin(direction);
        this.Type = "Throwable";
        this.xPos = x;
        this.yPos = y;
        this.weight = 0.1;
        this.width = 3;
        this.height = 3;
        this.life = 5;
        this.makeId();
        this.creatorId = creatorId;

        this.damage = damage;
    }

    move() {
        if (this.xVel !== 0 && this.yVel !== 0) {
            this.life = 20;
        } else {
            this.life--;
            if (this.life < 0) this.kill();
        }
        this.momentum();
    }


    draw() {
        board.fillStyle = this.color;
        board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);
    }
}

class Wood{
    constructor() {
        this.type = "Wood";
        this.name = "Wood";
        this.stackable = true;
        this.amount = 1;
        this.value = 3;
        this.description = "Can be used for building"
    }
}

class Stone{
    constructor() {
        this.type = "Stone";
        this.name = "Stone";
        this.stackable = true;
        this.amount = 1;
        this.value = 4;
        this.description = "Can be used for building"
    }

}

class Player extends DynamicObject{
    constructor(IDa){
        super();
        this.isYou = false;
        this.id = IDa;
        this.Type = "Player";
        this.xVel = 0;
        this.yVel = 0;
        this.xPos = getRandomInt(150);
        this.yPos = 0;
        this.shoottimer = 0;
        this.width = 20;
        this.height = 30;
        this.color = "#ffa0f0";
        this.weight = 1;
        this.shoottimer = 1;
        this.health = 100;
        this.alive = true;
        this.inventory = [];
        this.equiped = new weapon();
        this.chopTimer = 0;
        this.chopMax = 5;
    }

    move(){
        if (this.equiped) {
            if (typeof this.equiped.cool !== 'function') {
                this.equiped = convertToObject(this.equiped);
            }
            this.equiped.cool();
        }

        if (this.isYou && this.alive)this.control();

        this.bulletCollision();
        this.proximityCheck();
        this.momentum();
        this.chopTimer = Math.max(this.chopTimer-0.1,0);
    }

    bulletCollision(){
        for (const key of Object.keys(localArray)){
            const item = localArray[key];
            if(item.Type === "Bullet" || item.Type === "Arrow"|| item.Type === "Throwable"){
                if (this.isYou){
                    if (collide(this,item) && item.creatorId !== my_id){
                        this.hit(item,key);
                    }
                }else{
                    if (collide(this,item) && item.creatorId !== this.id){
                        this.hit(item,key);
                    }
                }
            }
        }
    }

    proximityCheck(){
        if (this.isYou && this.yPos+this.height > 120) {
        for (const key of Object.keys(localArray)){
            const item = localArray[key];

                if (this.xPos > item.xPos - 10 && this.xPos < item.xPos + item.width) {
                    if(item.Type === "Tree") {
                        localArray["UI"].nextTo = "Cutting";
                        item.displayText("[e] to chop");
                        if (keyboard.keyIsPressed("69") && this.chopTimer === 0) {
                            localArray["UI"].notify("+1 wood");
                            player.give(new Wood());
                            this.chopTimer = this.chopMax;
                        }
                    } else if(item.Type === "Rock") {
                        localArray["UI"].nextTo = "Mining";
                        item.displayText("[e] to mine");
                        if (keyboard.keyIsPressed("69") && this.chopTimer === 0) {
                            localArray["UI"].notify("+1 stone");
                            player.give(new Stone());
                            this.chopTimer = this.chopMax;
                        }
                    }else if(item.Type === "Shop") {
                        item.displayText("[e] to shop");
                        if (keyboard.keyIsPressed("69")) {
                            localArray["UI"].setTo("Shop");
                            localArray["UI"].shopLevel = item.level;
                            localArray["UI"].display();
                        }
                    } else localArray["UI"].nextTo = "";
                }
            }

        }
    }

    give(given){
        if (given.stackable){
            for (const item of this.inventory){
                if (item.Type === given.Type){
                    let getting = 1;
                    let got = 1;
                    if (item.amount) got = item.amount;
                    if (given.amount) getting = given.amount;
                    item.amount = getting + got;
                    return;
                }
            }

        }
        this.inventory.push(given);

    }

     hit(bullet,id){
         if (bullet.damage) this.health -= bullet.damage;
         delete localArray[id];
         kill(id);
         socket.emit("remove", id);
         if (this.health < 0){
             this.alive = false;
             if (this.isYou){
                 this.die()
             }
         }
     }

     die(){
        socket.emit("die",my_id);
        localArray["UI"].setTo("Die Screen");
        localArray["UI"].display();
     }

     respawn(){
         this.health = 100;
         this.alive = true;
         this.xPos = getRandomInt(1000)-500;
         this.yPos = 50;
     }

    control(){
        if (this.yPos === 120-this.height || this.colliding){
            if (keyboard.key[87]) this.yVel = -8;
            if (keyboard.key[65]) this.xVel -= 0.3;
            if (keyboard.key[68]) this.xVel += 0.3;
            this.xVel = Math.max(Math.min(this.xVel,15),-15);
        }else{
            if (keyboard.key[65]) this.xVel -= 0.4;
            if (keyboard.key[68]) this.xVel += 0.4;
            this.xVel = Math.max(Math.min(this.xVel,20),-20);
        }

        if (keyboard.click){
            if(localArray["UI"].name === "Overlay" && !keyboard.overMenu){
                this.shoot();
            }
        }
    }

    shoot(){
        this.equiped.shoot();
    }

     draw(){
        if (!this.alive){
            this.yPos = -500;
            return;
        }

         board.fillStyle = this.color;
         board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos, this.width, this.height);

         if (this.health < 100){
             const barWidth = 30;
             const center = (this.width/2)-(barWidth/2);
             const healthWidth = Math.max(barWidth*this.health/100,0);
             board.fillStyle = "#ff0000";
             board.fillRect(this.xPos + camera.xPos + center, this.yPos + camera.yPos - 10, barWidth, 4);

             board.fillStyle = "#90ff90";
             board.fillRect(this.xPos + camera.xPos + center, this.yPos + camera.yPos - 10,healthWidth , 4);
         }

     }
}

 class backgroundObject{
    constructor(size) {
        this.Type = "backgroundObj";
        this.xPos = getRandomInt(size*2)-size;
        this.yPos = getRandomInt(120);
        this.color = this.getGrassColor();
        this.width = (getRandomInt(4)*3)+3;
        this.height = 3;
        this.special = playOdds(1/10);

        if (this.special){

            this.flowerColor = "#FBC02D";
            this.flowerType = getRandomInt(3);
            if (playOdds(1/3)) this.flowerColor = "#F5F5F5";
            if (playOdds(1/3)) this.flowerColor = "#e53935";

        }
    }

    getGrassColor(){
        switch (getRandomInt(4.2)) {
            case 0:
                return "#689F38";
                break;

            case 1:
                return "#9E9D24";
                break;

            case 2:
                return "#43A047";
                break;

            case 3:
                return "#7CB342";
                break;

            case 4:
                return "#558B2F";
                break;
        }
    }

    draw(x,y){
        let holdX = this.xPos;
        let holdY = this.yPos;
        this.xPos += x;
        this.yPos += y;
        board.fillStyle = this.color;
        board.fillRect(this.xPos+camera.xPos,this.yPos+camera.yPos,this.width,3);

        if (this.special){
            switch (this.flowerType) {
                case 0:
                    board.fillRect(this.xPos + camera.xPos + 3, this.yPos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xPos + camera.xPos + 6, this.yPos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xPos + camera.xPos + 9, this.yPos + camera.yPos - 9, 3, 3);
                    break;
                case 1:
                    board.fillRect(this.xPos + camera.xPos + 3, this.yPos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xPos + camera.xPos, this.yPos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xPos + camera.xPos - 3, this.yPos + camera.yPos - 9, 3, 3);
                    break;
                case 2:
                    board.fillRect(this.xPos + camera.xPos + 3, this.yPos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xPos + camera.xPos + 3, this.yPos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xPos + camera.xPos + 3, this.yPos + camera.yPos - 9, 3, 3);
                    break;
            }

        }
        this.xPos = holdX;
        this.yPos = holdY;
    }
}

 class LocalMap{
    constructor(xPos) {
        this.Type = "LocalMap";
        this.xPos = xPos;
        this.backgroundColor = "#9CCC65";
        this.size = 100;
        this.complexity = 10;
        this.yPos = 120;
        this.backgroundArray = [];
    }

    drawFloor(){
        board.fillStyle = this.backgroundColor;
        let top = this.yPos + camera.yPos;
        board.fillRect(0,top,canvas.width,canvas.height - top + 10);
    }

    draw(){
        this.drawFloor();
        if (this.backgroundArray.length === 0) this.generateBG();
        for (let i = 0; i < this.backgroundArray.length;i++){
            let item = this.backgroundArray[i];
            item.draw(this.xPos,this.yPos);
        }
    }

    move(){}

    generateBG(){
        for (let i = 0; i < this.size/5;i++){
            let item = new backgroundObject(5000);
            this.backgroundArray.push(item);
        }
    }
}

class Cloud{
    constructor(){
        this.Type = "cloud";
        this.xPos = getRandomInt(canvas.width)*2;
        this.yPos = getRandomInt(270);
        this.xVel = 0.1 + 0.01 * getRandomInt(20);
        this.width = 40;
        this.height = 20;
        this.opacity = 0.7 + getRandomInt(30)/100;
        this.id = "L"+getRandomInt("1000");

        this.cloudParts = [];
        this.complexity = 6 + getRandomInt(10);
        for (let i = 0; i < this.complexity; i ++){
            this.cloudParts.push(new cloudPart())
        }
    }
    move(){
        this.xPos += this.xVel;
        if (this.xPos > canvas.width + this.width){
            this.xPos = -(canvas.width/2)-getRandomInt(canvas.width/2) ;
            this.yPos = getRandomInt(150);
        }
    }
    draw(){
        board.globalAlpha = this.opacity;
        board.fillStyle = "#ffffff";
        board.fillRect(this.xPos+ (camera.xPos*0.05),this.yPos + (camera.yPos*0.05),this.width,this.height);
        for (let i = 0; i < this.cloudParts.length; i ++){

            this.cloudParts[i].draw(this.xPos+ (camera.xPos*0.05),this.yPos + (camera.yPos*0.05))
        }
        board.globalAlpha = 1;
    }
}


class Background{
    constructor(){
        this.Type = "Background";
        this.id = "Background";
        this.xPos = 0;
        this.heightMap = [];
        this.distance = 0.08;

        let lastRand = canvas.height*0.85 + getRandomInt(10);
        for (let x = 0; x <= canvas.width * 2.5; x += 20){
            lastRand = lastRand + getRandomInt(10) - 5;
            this.heightMap.push(lastRand);
        }
        this.heightMap = this.heightMap.concat(this.heightMap.slice().reverse());

        this.heightMap2 = [];
        lastRand = canvas.height*0.7 + getRandomInt(40);
        for (let x = 0; x <= canvas.width  * 2; x += 20){
            lastRand = lastRand + getRandomInt(20) - 10;
            this.heightMap2.push(lastRand);
        }
        this.heightMap2 = this.heightMap2.concat(this.heightMap2.slice().reverse());

        this.heightMap3 = [];
        lastRand = canvas.height*0.6 + getRandomInt(40);
        for (let x = 0; x <= canvas.width * 1.5; x += 20){
            lastRand = lastRand + getRandomInt(20) - 10;
            this.heightMap3.push(lastRand);
        }
        this.heightMap3 = this.heightMap3.concat(this.heightMap3.slice().reverse());
    }
    move(){
        this.xPos = camera.xPos * 0.2;
    }
    draw(){
        this.distance = 0.01;
        board.strokeStyle = "#558B2F";
        board.fillStyle = "#689F38";
        this.drawHills(this.heightMap3);

        this.distance = 0.15;
        board.strokeStyle = "#7CB342";
        board.fillStyle = "#7CB342";
        this.drawHills(this.heightMap2);

        this.distance = 1;
        board.strokeStyle = "#8BC34A";
        board.fillStyle = "#8BC34A";
        this.drawHills(this.heightMap);
    }

    drawHills(heightMap){

        if (this.xPos < 0) {
            board.beginPath();
            board.moveTo(0, 150);
            for (let x = this.xPos; x <= canvas.width + 120 - this.xPos; x += 20) {
                const height = heightMap[Math.round((x - this.xPos) / 20 % heightMap.length)];
                board.lineTo(x + this.xPos* this.distance, height + camera.yPos *this.distance* 0.1);
            }
            board.lineTo(canvas.width, canvas.height);
            board.lineTo(0, canvas.height);
            board.closePath();
            board.stroke();
            board.fill();
        } else {
            board.beginPath();
            board.moveTo(canvas.width, 150);
            let counter = 0;
            for (let x = canvas.width+ this.xPos; x >= -120 - this.xPos; x -= 20) {
                counter ++;
                let index = Math.round(((x-this.xPos)/20) % heightMap.length);
                if (index < 0){
                    index = heightMap.length + (index% heightMap.length);
                }
                const height = heightMap[index];
                board.lineTo(x + this.xPos * this.distance, height + camera.yPos *this.distance* 0.1);
            }

            board.lineTo(0, canvas.height);
            board.lineTo(canvas.width, canvas.height);
            board.closePath();
            board.stroke();
            board.fill();
        }
    }
}

class cloudPart{
    constructor(){
        this.xPos = getRandomInt(120);
        this.yPos = getRandomInt(20);
        this.width = 20 + 10 * getRandomInt(2);
        this.height = 10 +  10 * getRandomInt(2);
        this.color = "#ffffff";
        if (playOdds(1/3)){
            this.color = "#FAFAFA";
        }else if (playOdds(1/3)){
            this.color = "#F5F5F5";
        }else if (playOdds(1/3)){
            this.color = "#EEEEEE";
        } else if (playOdds(1/3)){
            this.color = "#E0E0E0";
        }
    }
    draw(x,y){
        board.fillStyle = this.color;
        board.fillRect(x + this.xPos,y +this.yPos,this.width,this.height);
    }
}



class Keyboard{
    constructor(){
        this.key = {};
        this.keyRel = {};
        this.keyHold = {};
        this.keyOn = {};
        this.ph = {};

        this.click = false;
        this.clickRel = false;
        this.clickHold = false;
        this.clickOn = false;

        this.mouseX = 0;
        this.mouseY = 0;
        const windowRect = canvas.getBoundingClientRect();
        this.windowLeft = windowRect.left;
        this.windowTop = windowRect.top;
    }

    keyIsPressed(num) {
        if (this.keyOn[num]){
            this.keyOn[num] = false;
            return true;
        }
        return false;
    }

    isClicked() {
        if (this.clickOn){
            this.clickOn = false;
            return true;
        }
        return false;
    }

    keyIsDown(num) {
        if (this.key[num]){
            return true;
        }
        return false;
    }

    keyDown(num){
        this.stateChange(num);
    }

    keyUp(num){
        this.keyRel[num] = true;
        this.stateChange(num);
    }

    stateChange(num){
        this.keyRel[num] = !this.key[num] && this.keyHold[num];

        this.keyHold[num] = (this.key[num] && this.keyOn[num]) || (this.key[num] && this.keyHold[num]);

        this.keyOn[num] = this.key[num] && !this.keyHold[num];
    }

    clickChange(){
        this.clickRel = !this.click && this.clickHold;

        this.clickHold = (this.click && this.clickOn) || (this.click && this.clickHold);

        this.clickOn = this.click && !this.clickHold;
    }

    mouseUp(){
        this.click = false;
        this.clickChange();
    }

    mouseDown(){
        this.click = true;
        this.clickRel = true;
        this.clickChange();
    }
}

class weapon {
    constructor(){
        this.Type = "Weapon";
        this.name = "gun";
        this.reloadSpeed = 1;
        this.bulletVelocity = 3;
        this.cooling = this.reloadSpeed;
        this.amunitionType = "arrow";
        this.damage = 25;
    }

    shoot(){
        if (this.cooling > 0)return;
        let mouseRelX = keyboard.mouseX - player.xPos - camera.xPos;
        let mouseRelY = keyboard.mouseY - player.yPos - camera.yPos;
        let angle = Math.atan2(mouseRelY,mouseRelX);

        switch(this.amunitionType){
            case("arrow"):
                socket.emit('create', new arrow(player.xPos,player.yPos,player.xVel,player.yVel,angle,my_id,this.damage,this.bulletVelocity));
                break;
            case("throw"):
                socket.emit('create', new throwable(player.xPos,player.yPos,player.xVel,player.yVel,angle,my_id,this.damage,this.bulletVelocity));
                break;
            case("bullet"):
                socket.emit('create', new bullet(player.xPos,player.yPos,player.xVel,player.yVel,angle,my_id,this.damage,this.bulletVelocity));
                break;
        }
        this.cooling = this.reloadSpeed;
    }


    randomizeStats(lvl){
        const multiplier = 5/lvl;

        this.damage = 10+getRandomInt(40);
        this.reloadSpeed = getRandomInt(40)/10;
        this.bulletVelocity = 2+getRandomInt(8);

        this.damage /= multiplier;
        this.reloadSpeed /= multiplier;
        this.bulletVelocity /= multiplier;

        this.amunitionType = "arrow";
        this.name = "Bow";
        const type = getRandomInt(4);
        if(type > 1)this.amunitionType = "bullet";
        if(type > 1)this.name = "Gun";
        if(type > 2)this.amunitionType = "throw";
        if(type > 2)this.name = "Throwable";

        if (this.amunitionType === "arrow") {
            this.reloadSpeed *= Math.max(4,this.reloadSpeed*2);
            this.bulletVelocity *= 2;
            this.bulletVelocity = Math.min(Math.max(this.bulletVelocity,3),5);
        }

        if (this.amunitionType === "throw") this.bulletVelocity /= 4;

        if (this.amunitionType === "bullet")  this.bulletVelocity = Math.max(this.bulletVelocity,25);

        this.bulletVelocity /= 5;
    }

    cool(){
        this.cooling -= 0.05;
        this.cooling = Math.max(this.cooling,0);
    }
}

let game = new Game();
const player = new Player(my_id);
player.isYou = true;
let keyboard = new Keyboard();
let camera = {xPos:xDiff,yPos:yDiff};
let menu = null;
localArray["P"] = player;


function clearGlobe(){
    // let exceptions = [];
    // while (globalArray.length > 0){
    //     let item = globalArray.pop();
    //     if(item.Type !== "Player"){
    //         exceptions.push(item);
    //     }
    // }
    globalArray = [];
}

function unpackDynamicObjects(objects){
    clearGlobe();
    for (let i = 0; i < objects.length;i++){
        let itemDict = objects[i];
        if (itemDict.id !== my_id){
            const obj = convertToObject(itemDict);
            if (["Throwable","Arrow","Bullet","Crate","Shop","Bricks"].includes(obj.Type)){
                if (!localArray[obj.id] && !graveYard[obj.id]) localArray[obj.id] = obj;
            }else{
                globalArray.push(obj);
            }

        }
    }
}

function unpackMap(mapData){

    let map = convertToObject(mapData["0"]);
    localArray["M"] = map;
    const keys = Object.keys(mapData);
    for(const key of keys){
        if (key === "0") continue;
        localArray["L"+key] = convertToObject(mapData[key]);
    }
}

$(function () {
    socket.on('update'+player.id, function(objects){//update players
        unpackDynamicObjects(objects);
    });

    socket.on('loadIn'+player.id, function(mapData){//initial game load
        unpackMap(mapData);
    });


    socket.on('hit', function(itemId){//initial game load
        let item = getItemById(itemId);
        if (item)item.hitLocal();
    });
});

window.onload = function(){
    initGame();
    setInterval(loop,1000/framerate);

};

canvas.onkeyup = function(e){
    e = e || event;
    keyboard.key[e.keyCode] = e.type === 'keydown';
    keyboard.keyUp(e.keyCode);
};

canvas.onkeydown = function(e){
    e = e || event;
    keyboard.key[e.keyCode] = e.type === 'keydown';
    keyboard.keyDown(e.keyCode);
};

function initGame(){
    //loadColors();
    generateBg();
    for (let i = 0; i < 32; i ++){
        player.inventory.push(new weapon());
        player.inventory[i].randomizeStats(1+getRandomInt(4));
    }
    player.equiped = player.inventory[0];
}

function generateBg(){
    const bg = new Background();
    backgroundArray.push(bg);
    for (let i = 0; i < 14; i ++){
        const cloud = new Cloud();
        backgroundArray.push(cloud);
    }
}

function getRandomInt(max){
    return Math.floor(Math.random() * Math.floor(max));
}

function loop(){
    if(!gamePaused)move();
    cast();
    draw();
    timeNow = getTime();
    timeSec += 1000/framerate;
    gui();
    graveKeep()
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
    return result;
}

function cast(){
    frameNo ++;
    frameNo = frameNo % 2;
    if (!frameNo) socket.emit('update', player);
    //socket.emit('update', player);
}

function deepEquals(object1,object2){
    return true;
    // let attributeList = Object.keys(object1);
    // for (let a = 0; a < attributeList.length;a++){
    //     if(object1[])
    //     if (attributeList[a].Type === "Weapon"){
    //         converted[attributeList[a]] = convertToObject(itemDict[attributeList[a]]);
    //     }else{
    //         converted[attributeList[a]] = itemDict[attributeList[a]];
    //     }
    // }
return true;
}

function playOdds(chance){
    let result = Math.random();
    return (chance) >= result;
}

function draw(){
    board.clearRect(0, 0, canvas.width, canvas.height);//clears board for a new frame
    board.fillStyle = "#2196F3";
    board.fillRect(0,0,canvas.width,canvas.height);

    for (const item of backgroundArray){
        item.draw();
    }

    for (const item of globalArray){
        item.draw();
    }

    let local = Object.keys(localArray);
    for (let i = 0; i < local.length;i ++){
        const item = localArray[local[i]];
        if (item)if (item.Type !== "GUI")item.draw();
        // if (item.isGhost){
        //     console.log(`in localArray as id: ${local[i]}`);
        // }
    }

    camera.xPos = -player.xPos + (canvas.width/2) - player.width/2;
    camera.yPos = -player.yPos + (canvas.height*0.75)  - player.height/2;

    // board.fillStyle = "#000";
    // board.font = "18px vt323";
    // board.textAlign = "left";
    // board.fillText(`(${keyboard.mouseX}, ${keyboard.mouseY})`,15,20);
}

function move(){
    for (const item of backgroundArray){
       item.move();
    }
    for (const item of globalArray){
        if (item)item.move();
    }
    let local = Object.keys(localArray);
    for (let i = 0; i < local.length;i ++){
        const item = localArray[local[i]];
        if (item)if (item.Type !== "GUI")item.move();
    }
}

function graveKeep(){
    let grave = Object.keys(graveYard);
    for (let i = 0; i < grave.length;i ++){
        graveYard[grave[i]] -= 1;
        if (graveYard[grave[i]] < 0){
             delete graveYard[grave[i]]; 
        }
    }
}

function gui(){
    if (!localArray["UI"]){
        new GUI();
        localArray["UI"].setTo("Overlay");
        localArray["UI"].display();
    }
    localArray["UI"].draw();
}

function mouseMove(e){
    keyboard.mouseX = e.clientX - keyboard.windowLeft;
    keyboard.mouseY = e.clientY - keyboard.windowTop;
}

function mouseDown(){
    keyboard.mouseDown();
}

function mouseUp(){
    keyboard.mouseUp();
}

function kill(id){
    graveYard[id] = 100;
}

class Point{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

}

function collide(obj1,obj2){

    const l1 = new Point(obj1.xPos, obj1.yPos);
    const r1 = new Point(obj1.xPos + obj1.width,  obj1.yPos + obj1.height);
    const l2 = new Point(obj2.xPos, obj2.yPos);
    const r2 = new Point(obj2.xPos + obj2.width,  obj2.yPos + obj2.height);

    if(l1.x > r2.x || l2.x > r1.x) return false;

    if(l1.y > r2.y || l2.y > r1.y) return false;

    return true;
}