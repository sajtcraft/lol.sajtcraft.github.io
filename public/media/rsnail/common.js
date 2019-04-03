
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


function getDistance(x1, y1, x2, y2) {
	var dx = x2 - x1;
	var dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(x1, y1, x2, y2) {
	var dx = x2 - x1;
	var dy = y2 - y1;
	var angle = Math.floor((Math.atan2(dy, dx) * (180 / Math.PI)) - 90);
	if (angle < 0) {
		return angle + 360;
	} else {
		return angle;
	}
}

function getDirection(angle) {
	var d = Math.round(angle / 45);
	if (d > 7) {
		d = 0;
	}
	return d;
}

//console.log("findDistance",findDistance(10,100,10,200));
//console.log("findAngle",findAngle(10,10,20,20));
//console.log("findDirection",findDirection(60));