class CP {
  constructor(settings) {
    this.el = settings.el;
    this.stage = new createjs.Stage("canvas");

  }
  penguinSpriteSheet() {
    return {
      images: ["https://i.imgur.com/N7pCB21.png"],
      frames: [
        // x, y, width, height
        [102, 158, 32, 36],
        [34, 158, 32, 36],
        [136, 120, 32, 36],
        [136, 158, 32, 36],
        [206, 119, 32, 36],
        [68, 120, 32, 36],
        [34, 120, 32, 36],
        [0, 159, 32, 36],
        [180, 0, 34, 39],
        [0, 41, 34, 39],
        [108, 0, 34, 39],
        [144, 0, 34, 39],
        [0, 0, 34, 39],
        [36, 0, 34, 39],
        [216, 0, 34, 39],
        [72, 0, 34, 39],
        [27, 234, 25, 40],
        [68, 196, 25, 40],
        [149, 196, 25, 40],
        [95, 196, 25, 40],
        [203, 233, 25, 40],
        [176, 196, 25, 40],
        [0, 197, 25, 40],
        [122, 196, 25, 40],
        [138, 81, 32, 37],
        [172, 81, 32, 37],
        [104, 81, 32, 37],
        [211, 41, 32, 37],
        [0, 82, 32, 37],
        [211, 80, 32, 37],
        [70, 81, 32, 37],
        [36, 81, 32, 37],
        [204, 195, 32, 36],
        [68, 158, 32, 36],
        [0, 121, 32, 36],
        [204, 157, 32, 36],
        [102, 120, 32, 36],
        [170, 158, 32, 36],
        [170, 120, 32, 36],
        [34, 196, 32, 36],
        [36, 41, 33, 38],
        [71, 41, 33, 38],
        [106, 41, 33, 38],
        [141, 41, 33, 38],
        [176, 41, 33, 38]
      ],

      animations: {
        "stoped": [0],
        "stand5": [5],
        "stand6": [5],
        "stand7": [10],
        "stand0": [15],
        "stand1": [20],
        "stand2": [25],
        "stand3": [25],
        "walk4": [0, 4],
        "walk5": [5, 9],
        "walk6": [5, 9],
        "walk7": [10, 14],
        walk: {
          frames: [1, 2, 3, 4, 5, 6, 7],
          speed: .8
        },
        "walk1": [3, 4],
        "walk2": [25, 29],
        "walk3": [25, 29]
      },
      framerate: 24,



    };
  }
  handleTick() {
    this.stage.update();
  }
  penguin() {
    const penguinSprite = new createjs.SpriteSheet(this.penguinSpriteSheet());
    const generatedPenguin = new createjs.Sprite(penguinSprite, "stoped");
    createjs.Ticker.addEventListener("tick", this.handleTick());
    this.stage.on("stagemousedown", (e) => {

      console.log("aaa")
      this.penguin().gotoAndPlay(this.penguinSpriteSheet()["walk"]);
      createjs.Tween.get(this.penguin, { override: true }).to({ x: e.stageX, y: e.stageY }, 2500, createjs.Ease.linear).call(handleComplete);

      function handleComplete() {
        this.penguin().gotoAndPlay("stoped");
      }


    });
  }
  createShape2() {
    const circle = new createjs.Shape();
    circle.graphics.beginFill("green").drawCircle(0, 0, 10);
    circle.x = circle.y = 50;
    this.stage.addChild(circle);

  }

  start() {
    this.penguin();
    this.createShape2();
    this.stage.addChild(this.penguin());

    this.stage.update();

  }
}
const p = new CP({ el: "canvas" });
p.start();
// stage.addChild(circle);
//Update stage will render next frame
// stage.update();
