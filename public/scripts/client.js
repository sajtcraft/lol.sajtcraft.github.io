// Artwork

function Artwork(data) {

    this.background;
    this.foreground;

    this.character = this.createCharacterSprite(data.character);

    if (data.roomPath) {
        this.roomPath = data.roomPath;
    } else {
        this.roomPath = 'media/rooms/';
    }

    this.ring = new createjs.Shape();
    this.ring.graphics.f().s("#3399FF").ss(2).de(0, 0, 32, 22);
    this.ring.regX = 16;
    this.ring.regY = 11;

    this.shadow = new createjs.Shape();
    this.shadow.graphics.f("rgba(0,0,0,0.2)").s().de(0, 0, 28, 18);
    this.shadow.regX = 14;
    this.shadow.regY = 9;

    this.crosshair = new createjs.Shape();
    this.crosshair.graphics.setStrokeStyle(1).beginStroke("black").moveTo(-10, 0).lineTo(10, 0).moveTo(0, -10).lineTo(0, 10);


}

Artwork.prototype.createCharacterSprite = function (data) {

    var spriteSheet = new createjs.SpriteSheet({
        images: data.images,
        frames: data.frames,
        animations: data.animations
    });

    var sprite = new createjs.Sprite(spriteSheet, "stand4");
    sprite.scaleX = data.scaleX;
    sprite.scaleY = data.scaleY;
    sprite.regX = data.regX;
    sprite.regY = data.regY;
    sprite.framerate = data.framerate;
    sprite.balloonX = data.balloonX;
    sprite.balloonY = data.balloonY;

    return sprite;

}

function calculateDistance(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateAngle(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y1 - y2;
    var r = Math.atan2(dx, dy);
    var a = Math.floor(r * 180 / Math.PI);
    if (a < 0) {
        return a + 360;
    } else {
        return a;
    }
}

function findDirection(r) {
    var d = Math.floor((r + 22.5) / 45);
    if (d > 7) {
        return 0;
    } else {
        return d;
    }
}


//function checkBadWords(text) {
//    var badWords = ['fuck', 'shit', 'asshole'];
//    var str = text.toLowerCase();
//    for (var n = 0; n < badWords.length; n++) {
//        if (str.search(badWords[n]) > -1) {
//            return true;
//        }
//    }
//    return false;
//}
function Events() {

}

function Feed() {
    this.M = true;
    this.P = false;
    this.A = true;
    this.R = true;
}

Feed.prototype.toggle = function (key) {
    if (this[key] !== undefined) {
        this[key] = !this[key];
    }
}

Feed.prototype.log = function (eventName, args) {
    if (this[eventName]) {
        console.log(eventName, args);
    }
}

function Player() {

    this.isMoving = false;
    this.hasFrames = false;
    this.character;
    this.nickname;
    this.balloon;
    this.direction = 0;
    this.animation = 'none';
    this.speed = 5;

    createjs.Container.call(this);

}

// This allows Player to adopt the CreateJS Container Class
Player.prototype = Object.create(createjs.Container.prototype);


Player.prototype.setCharacter = function (mc) {
    this.character = mc;
    if (typeof mc.gotoAndPlay === "function") {
        this.hasFrames = true;
    }
}

Player.prototype.updateDirection = function (d) {
    this.direction = d;
}

Player.prototype.updateRotation = function (r) {
    this.character.rotation = r;
}

Player.prototype.updateAnimation = function (name) {
    if (name !== undefined) {
        this.animation = name;
    }
    if (this.hasFrames) {
        if (this.isMoving) {
            this.character.gotoAndPlay('walk' + this.direction);
        } else {
            this.character.gotoAndPlay('stand' + this.direction);
        }
    }

}

/*

Player.prototype.updateAnimation = function (frame) {
    this.mc_character.gotoAndPlay(frame);
}

*/

var dpr = window.devicePixelRatio;

function Room(stage, artwork, data) {

    this.stage = stage;
    this.artwork = artwork;

    this.room = new createjs.Container();
    this.game = new createjs.Container();
    this.balloons = new createjs.Container();
    this.nicknames = new createjs.Container();

    this.game.addEventListener("tick", function (event) {
        //TODO: Only swapDepth if players are moving
        event.target.children.sort(sortDepth);
    });

    if (data.artwork && data.artwork.sprites) {
        console.log(data.artwork.sprites.images[0]);
        data.artwork.sprites.images[0] = data.artwork.sprites.images[0];
        this.spritesheet = new createjs.SpriteSheet(data.artwork.sprites);
    }

    this.playerlist = {};

    if (data.artwork && data.artwork.background !== undefined) {
        console.log('Add Background:', data.artwork.background);
        var background = new createjs.Bitmap(this.artwork.roomPath + data.artwork.background);
        this.room.addChild(background);
    }

    this.room.addChild(this.game);

    if (data.artwork && data.artwork.foreground !== undefined) {
        console.log('Add Foreground:', data.artwork.foreground);
        var foreground = new createjs.Bitmap(this.artwork.roomPath + data.artwork.foreground);
        this.room.addChild(foreground);
    }

    this.room.addChild(this.nicknames);
    this.room.addChild(this.balloons);

    if (data.artwork && data.artwork.props !== undefined) {
        for (var n = 0; n < data.artwork.props.length; n++) {
            var prop = data.artwork.props[n];
            var sprite = new createjs.Sprite(this.spritesheet);
            sprite.gotoAndStop(prop[0]);
            sprite.x = prop[1];
            sprite.y = prop[2];
            this.game.addChild(sprite);
        }
    }

    this.room.addChild(this.edit);

    this.stage.addChild(this.room);
    this.stage.update();

    if (data.playerlist != undefined) {
        for (var n = 0; n < data.playerlist.length; n++) {
            this.addPlayer(data.playerlist[n], this.useDirection);
        }
    }

}

Room.prototype.sortDepth = function () {
    this.game.children.sort(sortDepth);
}

function sortDepth(s1, s2) {
    return s1.y - s2.y;
}

Room.prototype.addPlayer = function (crumb) {
    var id = crumb.i;
    if (this.playerlist[id] == undefined) {

        var mc = new Player();

        // When you clone a sprite the balloonX/Y is removed.
        // TODO: Work with multiple characters
        mc.balloonX = this.artwork.character.balloonX;
        mc.balloonY = this.artwork.character.balloonY;

        if (crumb.c && this.artwork.characters[crumb.c]) {
            var sprite_mc = this.artwork.characters[crumb.c].clone();
        } else {
            var sprite_mc = this.artwork.character.clone();
        }

        if (this.artwork.shadow) {
            mc.addChild(this.artwork.shadow.clone());
        }

        if (this.artwork.ring) {
            mc.addChild(this.artwork.ring.clone());
        }

        mc.addChild(sprite_mc);

        if (this.artwork.crosshair) {
            //mc.addChild(this.artwork.crosshair.clone());
        }

        if (crumb.s !== undefined && crumb.s > 0) {
            mc.speed = crumb.s;
        }

        mc.x = crumb.x;
        mc.y = crumb.y;

        mc.setCharacter(sprite_mc);

        this.game.addChild(mc);

        var balloon = new createjs.Container();
        balloon.x = crumb.x;
        balloon.y = crumb.y;
        mc.balloon = balloon;
        this.balloons.addChild(balloon);

        var nickname = new createjs.Container();
        nickname.x = crumb.x;
        nickname.y = crumb.y;
        var text = new createjs.Text(crumb.n, "12px Arial", "#000000");
        text.textAlign = 'center';
        text.lineWidth = 100;
        text.y = 15;
        nickname.addChild(text);

        mc.nickname = nickname;
        this.nicknames.addChild(nickname);

        this.stage.update();
        this.playerlist[id] = mc;
    }
}

Room.prototype.addBalloon = function (crumb) {
    var mc = this.playerlist[crumb.i];

    var balloon_mc = new createjs.Container();

    var text = new createjs.Text(crumb.m, "16px Arial", "#000000");
    text.textAlign = 'center';
    text.lineWidth = 100;

    var padding = 20;

    var bounds = text.getBounds();

    var balloon = createBalloon(100, bounds.height);
    balloon_mc.addChild(balloon, text);
    balloon_mc.y = 0 - bounds.height - mc.balloonY;

    mc.balloon.addChild(balloon_mc);

    var that = this;

    setTimeout(function () {
        mc.balloon.removeChild(balloon_mc);
        that.stage.update();
    }, 5000);
    this.stage.update();

}

Room.prototype.removePlayer = function (crumb) {
    //console.log('removePlayer', crumb);
    var mc = this.playerlist[crumb.i];
    this.game.removeChild(mc);
    this.balloons.removeChild(mc.balloon);
    this.nicknames.removeChild(mc.nickname);
    delete this.playerlist[crumb.i];
    this.stage.update();
}

Room.prototype.movePlayer = function (crumb) {
    var mc = this.playerlist[crumb.i];

    mc.isMoving = true;

    var direction = findDirection(crumb.r)
    mc.updateDirection(direction);

    mc.updateAnimation('walk');

    var d = calculateDistance(mc.x, mc.y, crumb.x, crumb.y);
    var s = d * mc.speed;

    mc.tween = createjs.Tween.get(mc, {
        override: true
    }).to({
        x: crumb.x,
        y: crumb.y
    }, s, createjs.Ease.linear).call(function () {
        this.isMoving = false;
        mc.updateAnimation('stand');
        mc.nickname.x = mc.x;
        mc.nickname.y = mc.y;
        mc.balloon.x = mc.x;
        mc.balloon.y = mc.y;
    }).addEventListener("change", function () {
        mc.nickname.x = mc.x;
        mc.nickname.y = mc.y;
        mc.balloon.x = mc.x;
        mc.balloon.y = mc.y;
    });
    this.stage.update();
}


function createBalloon(width, height) {

    var p = 10; // Padding
    var r = 5; // Radius

    var h = height + (p * 2);
    var w = width + (p * 2);

    var balloon = new createjs.Shape();
    balloon.graphics.setStrokeStyle(1).beginStroke('#888888').beginFill("#FFFFFF");
    balloon.graphics
        .moveTo(r, 0)
        .arcTo(w, 0, w, r, r)
        .arcTo(w, h, w - r, h, r)
        .lineTo(80, h).lineTo(70, h + 10).lineTo(70, h)
        .arcTo(0, h, 0, h - r, r)
        .arcTo(0, 0, r, 0, r);
    balloon.x = 0 - w / 2;
    balloon.y = 0 - p;
    return balloon;
}

function World(socket, artwork, canvas) {

    var world = this;
    var room;
    this.socket = socket;
    this.player;

    this.artwork = new Artwork(artwork);
    this.room = room;
    this.events = new Events(socket, world, room);

    this.stage = new createjs.Stage(canvas);
    this.stage.on("stagemousedown", function (evt) {
        var x = Math.floor(evt.stageX);
        var y = Math.floor(evt.stageY);
        socket.emit('click', {
            x: x,
            y: y
        });
    });

    createjs.Ticker.framerate = 60;
    createjs.Ticker.on("tick", function (event) {
        world.stage.update(event);
    });

    if (socket !== undefined) {
        this.socketHandler(socket);
    }
}

World.prototype.setStage = function (canvas) {
    this.stage = new createjs.Stage(canvas);
}

World.prototype.socketHandler = function (socket) {

    var world = this;

    socket.on('connect', function () {});

    socket.on('disconnect', function () {
        console.log('DISCONNECT');
    });

    socket.on('login', function (data) {
        console.log('login', data);
        world.player = data;
        socket.emit('joinRoom', {
            roomId: 'tavern'
        });
    });

    socket.on('joinRoom', function (data) {
        console.log('joinRoom', data);
        world.createRoom(data, false);
    });

    socket.on('A', function (crumb) {
        console.info('A', crumb);
        
        world.Room.addPlayer(crumb);
    });

    socket.on('R', function (crumb) {
        console.info('R', crumb);
        world.room.removePlayer(crumb);
    });

    socket.on('P', function (crumb) {
        world.room.movePlayer(crumb);
    });

    socket.on('X', function (crumb) {
        console.info('X', crumb);
        world.room.movePlayer(crumb);
    });

    socket.on('M', function (crumb) {
        console.info('M', crumb);
        world.room.addBalloon(crumb);
    });
};


World.prototype.login = function (ticket) {
    console.log('login', ticket);
    this.socket.open();
    this.socket.emit('login', {
        ticket: ticket
    });
};

World.prototype.logout = function () {
    console.log('logout');
    sessionStorage.clear();
    this.socket.disconnect();
    if (cheerioPath) {
        document.location.href = cheerioPath;
    }
}

World.prototype.sendMessage = function (message) {
    console.log('sendMessage', message);
    if (message.substr(0, 1) == '/') {
        var command = message.split(' ');
        if (command[0] == '/log') {
            this.log.toggle(command[1]);
        }
    } else {
        this.socket.emit('sendMessage', {
            message: message
        });
        // Local Chat
        //        var crumb = {
        //            i: this.player.playerId,
        //            m: message
        //        }
        //        console.info('M', crumb);
        //        this.room.addBalloon(crumb);
    }
}

World.prototype.createRoom = function (data) {
    console.log('createRoom', data);
    this.room = new Room(this.stage, this.artwork, data, false);
};