class play {
  constructor(settings) {
    this.playerId = settings.playerId;
    this.gameSession = settings.session || "";
    this.isNewPlayer = settings.isNewPlayer;
    this.socketPath = settings.socketPath;
    this.hamster_data = settings.hamster_data;
  }
  
  init(){
      
  }
}