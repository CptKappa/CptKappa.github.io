import { Mandelbrot } from './Mandelbrot.js';

let mandelbrot;

function main() {
	mandelbrot = new Mandelbrot("#glCanvas", document.body.clientWidth, document.body.clientHeight);




	document.addEventListener('wheel', function(e) {
		mandelbrot.scale(-e.deltaY/1000);
	});
	
	let mouseLocationX;
	let mouseLocationY;
	document.addEventListener('mousedown', function(e) {
		if (e.button == 0) {
			mouseLocationX = e.clientX;
			mouseLocationY = e.clientY;
		}
	});

	document.addEventListener('mouseup', function(e) {
		if (e.button == 0) {
			let dragX = e.clientX - mouseLocationX;
			let dragY = e.clientY - mouseLocationY;

			mandelbrot.translate(dragX, dragY);
		}

		if (e.button == 1 || e.button == 2) {
			mandelbrot.printPos(e.clientX, e.clientY);
		}
	});

	window.addEventListener('resize', function(e) {
		mandelbrot.resize(document.body.clientWidth, document.body.clientHeight);
	});

	
	mandelbrot.render();
}

window.addEventListener('load', main)