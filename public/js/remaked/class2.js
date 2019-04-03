class CP {
  constructor(settings) {
    this.el = settings.el;
    this.stage = new createjs.Stage("canvas");
  }

  createStage() {
    const stage = new createjs.Stage("canvas");
  }

  createShape() {
    const circle = new createjs.Shape();
    circle.graphics.beginFill("red").drawCircle(0, 0, 40);
    circle.x = circle.y = 50;
    this.stage.addChild(circle);
    this.stage.update();
  }
  start() {
    this.createShape();

  }


}
const p = new CP({ el: "canvas" });
p.start();
// stage.addChild(circle);
//Update stage will render next frame
// stage.update();
