let slider;

let zoom = 14;
let centerX = -0.5;
let centerY = 0;
const maxIterations = 100;

let mouseLocationX = 0;
let mouseLocationY = 0;

function setup() {
	//createCanvas(1024, 768);
	createCanvas(document.body.clientWidth, document.body.clientHeight);
	
	background(0);
	colorMode(HSB, 1);
	//colorMode(HSB, 360, 1, 1);

	textSize(16);
	strokeWeight(0);

	/*
	slider = createSlider(13, 100, 13, 1);
	slider.position(20, 800);
	slider.style('width', '640px');
	slider.touchEnded(drawMandelbrot);
	*/

	drawMandelbrot();
}
  
function draw() {
	
}

function drawMandelbrot() {
	background(0);

	colorMode(HSB, 1);
	
	const startTime = millis();

	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {

			const x0 = (i - width / 2) / getZoom() + centerX;
			const y0 = (j - height / 2) / getZoom() + centerY;

			const iterations = calcMandelbrotOptimized(x0, y0, maxIterations);
			set(i, j, color(iterations / maxIterations, 1.0, iterations < maxIterations ? 1.0 : 0.0));
			//set(i, j, color(Math.pow(iterations / maxIterations * 360, 1.5) % 360, 1.0, 1-iterations / maxIterations));
		}
	}

	updatePixels();

	colorMode(RGB, 255);
	
	fill(0, 0, 0, 127);
	rect(5, 5, 100, 33);

	fill(255, 255, 255, 255);
	text((millis() - startTime) + 'ms', 15, 27);
}

function mouseWheel(e) {
	// down +
	// up -
	const amount = e.delta;

	const zoomOld = getZoom();
	//slider.value(slider.value() + -amount/100);
	zoom = zoom + -amount/100;
	const zoomNew = getZoom();

	const zoomDivInv = zoomOld - zoomNew;
	const zoomDen = zoomOld * zoomNew;

	// [-width/2, width/2]
	const mX = mouseX - width / 2;
	const mY = mouseY - height / 2;

	const mXDiff = (mX * zoomDivInv) / zoomDen;
	const mYDiff = (mY * zoomDivInv) / zoomDen;

	centerX = centerX - mXDiff;
	centerY = centerY - mYDiff;
	
	drawMandelbrot();

	return false;
}

function mousePressed() {
	mouseLocationX = mouseX;
	mouseLocationY = mouseY;
}

function mouseReleased() {
	let dragX = mouseX - mouseLocationX;
	let dragY = mouseY - mouseLocationY;

	centerX = centerX - (dragX / getZoom());
	centerY = centerY - (dragY / getZoom());

	drawMandelbrot();

	console.log({ screen: [mouseX, mouseY], world: [(mouseX - width / 2) / getZoom() + centerX, (mouseY - height / 2) / getZoom() + centerY] });
}

function getZoom() {
	let z = zoom;

	if (slider !== undefined) {
		z = slider.value();
	}

	return Math.pow(1.5, z);
}