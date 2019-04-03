class Game {
	constructor(config) {
		this.playerId = config.playerId;
		this.gameSession = config.session;
		this.isNewPlayer = config.isNewPlayer;
		this.socketIO = config.socketAndress;
		this.nickname = config.nickname

		this.socket;
	}
	init() {
		if (this.playerId != null || this.playerId != "") {
			this.socket = io(this.socketIO, { autoConnect: false, transports: ['websocket'] });
			this.loginPlayer({ id: this.playerId, nickname: this.nickname });
			this.listen();
		}
	}
	listen() {
		this.socket.on("login", (data) => {
			console.log("login");
			console.log(data);
		});
		this.socket.on("joinRoom",(data)=>{
			console.log("joinRoom",data);
			//this.createRoom(data,!)
		})
	}

	loginPlayer(user) {
		console.log("Signing user", user.id);
		this.socket.open();
		/**
		 * session is a quick fix. Later it should be replaced with the server generated session
		 */

		this.socket.emit("login", { playerId: user.id, nickname: user.nickname, session: user.id });

	}
	
	Artwork(){
		this.background;
		this.foreground;
		this.character = this.createCharacterSprite
	}

}
