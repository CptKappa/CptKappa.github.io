import * as mb from './mandelbrot.js'

let zoom = 0.0;
const scalingFactor = [1.0, 1.0];
const translationVector = [-0.5, 0.0];

function map(val, currMin, currMax, min, max) {
	return (val - currMin) / (currMax - currMin) * (max - min) + min;
}

function moveTo(zoom, translation) {
	setZoom(zoom);
	translationVector[0] = translation[0];
	translationVector[1] = translation[1];
}

function setZoom(z) {
	zoom = z;
	scalingFactor[0] = Math.pow(1.5, z);
	scalingFactor[1] = Math.pow(1.5, z);
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("Error occured while compiling shaders: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function initShaders(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		alert("Error occured while linking shaders: " + gl.getProgramInfoLog(program));
		return null;
	}

	return program;
}

function initBuffers(gl, mandelBounds) {
	const positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [
		1.0, 1.0, 
		-1.0, 1.0, 
		1.0, -1.0, 
		-1.0, -1.0
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const mandelPosBuffer = mb.initMandelBuffers(gl, mandelBounds);

	return {
		position: positionBuffer, 
		mandelPosition: mandelPosBuffer
	}
}

function drawScene(gl, programInfo, buffers) {
	gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

	// set clear color to black, fully opaque
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// clear buffer
	gl.clear(gl.COLOR_BUFFER_BIT);

	const color = [1.0, 0.0, 0.0, 1.0];


	mb.setSceneAttribs(gl, programInfo, buffers);


	gl.useProgram(programInfo.program);
	
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

	gl.uniform2fv(programInfo.uniformLocations.scalingFactor, scalingFactor);
	gl.uniform2fv(programInfo.uniformLocations.translationVector, translationVector);
	gl.uniform2fv(programInfo.uniformLocations.aspect, [aspect, 1.0]);
	gl.uniform4fv(programInfo.uniformLocations.color, color);

	{
		const offset = 0;
		const vertexCount = 4
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}

function drawMandelbrot(gl, programInfo, buffers, mandelBounds) {
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

	console.log("Zoom: " + zoom + "; Scaling: " + scalingFactor);
	console.log("Translation: " + translationVector);
	console.log("World: [" + (mandelBounds.minX * aspect / scalingFactor[0] + translationVector[0]) + ", " + (mandelBounds.minY / scalingFactor[1] + translationVector[1]) + "], [" + (mandelBounds.maxX * aspect / scalingFactor[0] + translationVector[0]) + ", " + (mandelBounds.maxY / scalingFactor[1] + translationVector[1]) + "]");

	drawScene(gl, programInfo, buffers);
}

function main() {
	const canvas = document.querySelector("#glCanvas");
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	// init GL context
	const gl = canvas.getContext("webgl2");

	// webgl working?
	if (gl === null) {
		alert("Unable to initialize WebGL. ");
		return;
	}

	const shaders = mb.getShaders();
	const program = initShaders(gl, shaders.getVertexShader(), shaders.getFragmentShader());

	const programInfo = mb.getProgramInfo(gl, program);



	

	const mandelBounds = {
		minX: -1.5, 
		minY: -1.5, 
		maxX: 1.5, 
		maxY: 1.5
	};
	

	const buffers = initBuffers(gl, mandelBounds);
	setZoom(0);
	//moveTo(28.55999999999999, [-0.6978946059304841, 0.3795984439108146]);
	//moveTo(32.63999999999999, [-0.6978946059304841, 0.3795984439108146]);
	//moveTo(35.29199999999991, [-0.6978946059304841, 0.3795984439108146]);
	//moveTo(0, [-0.6978946059304841, 0.3795984439108146]);
	drawMandelbrot(gl, programInfo, buffers, mandelBounds);


	let pointLocationX;
	let pointLocationY;
	let touchZoomDistance;
	let touchEvent = 'none';
	document.addEventListener('touchstart', function(e) {
		console.log(e);
		
		if (e.touches.length === 1) {
			// save point
			touchEvent = 'translating';
			pointLocationX = e.changedTouches[0].clientX;
			pointLocationY = e.changedTouches[0].clientY;
		}

		if (e.touches.length === 2) {
			// zoom event
			touchEvent = 'zooming';
			touchZoomDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
		}
	});

	document.addEventListener('touchmove', function(e) {
		console.log(e);
	});

	document.addEventListener('touchend', function(e) {
		console.log(e);

		if (touchEvent === 'translating') {
			const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

			let dragX = e.changedTouches[0].clientX - pointLocationX;
			let dragY = e.changedTouches[0].clientY - pointLocationY;

			// flipped sign because mathematical y-axis (positive top, negative bottom) doesnt match the screens y-axis (negative top, positive bottom)
			translationVector[0] = translationVector[0] - map(dragX, -gl.canvas.clientWidth/2, gl.canvas.clientWidth/2, mandelBounds.minX * aspect, mandelBounds.maxX * aspect) / scalingFactor[0];
			translationVector[1] = translationVector[1] + map(dragY, -gl.canvas.clientHeight/2, gl.canvas.clientHeight/2, mandelBounds.minY, mandelBounds.maxY) / scalingFactor[1];
		}

		if (touchEvent === 'zooming') {
			let currZoomDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
			let delta = currZoomDist - touchZoomDistance;

			console.log(delta);

			let newZoom = zoom + delta/1000;

			setZoom(newZoom);
		}

		drawMandelbrot(gl, programInfo, buffers, mandelBounds);

		touchEvent = 'none';
	});


	window.addEventListener('resize', function(e) {
		const canvas = document.querySelector("#glCanvas");

		console.log("[Resize-Event] Aspect: " + canvas.width/canvas.height + " -> " + document.body.clientWidth/document.body.clientHeight);

		canvas.width = document.body.clientWidth;
		canvas.height = document.body.clientHeight;
		
		drawScene(gl, programInfo, buffers);
	});

	document.addEventListener('wheel', function(e) {
		let newZoom = zoom + -e.deltaY/1000;

		//if (newZoom < 0.0) { newZoom = 0.0 }

		setZoom(newZoom);

		drawMandelbrot(gl, programInfo, buffers, mandelBounds);
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
			const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

			let dragX = e.clientX - mouseLocationX;
			let dragY = e.clientY - mouseLocationY;

			// flipped sign because mathematical y-axis (positive top, negative bottom) doesnt match the screens y-axis (negative top, positive bottom)
			translationVector[0] = translationVector[0] - map(dragX, -gl.canvas.clientWidth/2, gl.canvas.clientWidth/2, mandelBounds.minX * aspect, mandelBounds.maxX * aspect) / scalingFactor[0];
			translationVector[1] = translationVector[1] + map(dragY, -gl.canvas.clientHeight/2, gl.canvas.clientHeight/2, mandelBounds.minY, mandelBounds.maxY) / scalingFactor[1];

			drawMandelbrot(gl, programInfo, buffers, mandelBounds);
		}

		if (e.button == 1 || e.button == 2) {
			const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

			console.log({
				screen: [e.clientX, e.clientY], 
				world: [
					map(e.clientX, 0, gl.canvas.clientWidth, mandelBounds.minX * aspect, mandelBounds.maxX * aspect) / scalingFactor[0] + translationVector[0], 
					map(e.clientY, 0, gl.canvas.clientHeight, mandelBounds.minY, mandelBounds.maxY) / scalingFactor[1] + translationVector[1]
				]
			});
		}
	});
}

window.addEventListener('load', main)