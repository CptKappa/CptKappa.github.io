import { GLCanvas } from './GLCanvas.js';
import * as shaders from './shaders.js'

export class Mandelbrot extends GLCanvas {
	#currTex;

	#positionBuffer;
	#texCoordBuffer;

	#attribLocations;
	#uniformLocations;

	#mandelbrotBounds = {};

	#buildWorker;
	#currBuildRequests;
	#skippedNewBuild;

	constructor(canvasId, width, height, pixelsPerPoint) {
		super(canvasId, width, height);

		// setting initial values
		this.center = [-0.5, 0];
		this.zoom = 14;
		this.maxIterations = 100;
		
		this.viewZoom = 0;
		this.viewScalingFactor = [1.0, 1.0];
		this.viewTranslationVector = [0.0, 0.0];

		this.pixelsPerPoint = pixelsPerPoint;


		this.#updateBounds();

		super.loadShaders(shaders.getVertexShader(), shaders.getFragmentShader());

		this.addTextField('frametime');
		this.addTextField('buildtime');

		this.#loadLocations();
		this.#initBuffers();

		this.#skippedNewBuild = false;
		this.#currBuildRequests = 0;

		this.#buildWorker = new Worker('mandelbrotGLcpu/buildWorker.js');

		this.#buildWorker.addEventListener('message', (e) => {
			const { type, data } = e.data;

			if (type == 'render') {
				// adjust zoom
				this.viewZoom = this.viewZoom - (data.usedZoom - this.zoom);
				this.viewScalingFactor[0] = this.#getZoom(this.viewZoom);
				this.viewScalingFactor[1] = this.#getZoom(this.viewZoom);
				this.zoom = data.usedZoom;
				
				// adjust translation
				this.center[0] = data.usedCenter[0];
				this.center[1] = data.usedCenter[1];
				this.viewTranslationVector[0] = this.viewTranslationVector[0] - data.usedViewTranslationVector[0];
				this.viewTranslationVector[1] = this.viewTranslationVector[1] - data.usedViewTranslationVector[1];

				console.log("Build:");
				this.#drawMandelbrot(data.usedWidth, data.usedHeight, data.buffer);
				this.textFields['buildtime'].nodeValue = data.buildTime;

				this.#currBuildRequests -= 1;

				if (this.#skippedNewBuild) {
					this.#buildMandelbrot();
				}
			}
		});

		// setting initial size
		this.#resizeCalcBuffer();
	}

	render() {
		this.#buildMandelbrot();
	}

	resize(width, height) {
		console.log("[Resize-Event] Aspect: " + this.canvas.width / this.canvas.height + " -> " + width / height);

		super.resize(width, height);

		this.#resizeCalcBuffer();

		this.#updateBounds();

		this.#buildMandelbrot();
	}

	scale(delta) {
		this.viewZoom = this.viewZoom + delta;

		this.viewScalingFactor[0] = this.#getZoom(this.viewZoom);
		this.viewScalingFactor[1] = this.#getZoom(this.viewZoom);
		
		this.#updateBounds();

		// draw primitive
		this.#drawMandelbrot(this.canvas.width, this.canvas.height);

		// start building
		this.#buildMandelbrot();
	}

	translate(dragX, dragY) {
		// flipped sign because mathematical y-axis (positive top, negative bottom) doesnt match the screens y-axis (negative top, positive bottom)
		this.viewTranslationVector[0] = this.viewTranslationVector[0] - dragX / this.canvas.clientWidth / this.viewScalingFactor[0];
		this.viewTranslationVector[1] = this.viewTranslationVector[1] + dragY / this.canvas.clientHeight / this.viewScalingFactor[1];

		this.#updateBounds();

		// draw primitive
		this.#drawMandelbrot(this.canvas.width, this.canvas.height);
		// start building
		this.#buildMandelbrot();
	}
	
	#drawMandelbrot(width, height, mandelbrotData) {
		const startTime = Date.now();
	
		console.log("Zoom: " + this.zoom + "; Scaling: " + this.#getZoom() + "; ViewZoom: " + this.viewZoom + "; ViewScaling: " + this.viewScalingFactor);
		console.log("Center: " + this.center + "; ViewTranslation: " + this.viewTranslationVector);
		console.log("World: [" + this.#mandelbrotBounds.minX + ", " + this.#mandelbrotBounds.minY + "], [" + this.#mandelbrotBounds.maxX + ", " + this.#mandelbrotBounds.maxY + "]");
	
		if (mandelbrotData) {
			this.#currTex = this.#loadTexture(mandelbrotData, width, height);
		}
	
		this.#drawScene();
	
		const lastFrameTime = Date.now() - startTime;
		this.textFields['frametime'].nodeValue = lastFrameTime;
	}
	
	#buildMandelbrot() {
		if (this.#currBuildRequests <= 0) {
			this.#currBuildRequests += 1;
			
			this.#skippedNewBuild = false;

			const worldWidth = this.#mandelbrotBounds.maxX - this.#mandelbrotBounds.minX;
			const worldHeight = this.#mandelbrotBounds.maxY - this.#mandelbrotBounds.minY;

			const viewWorldTranslationX = this.viewTranslationVector[0] * worldWidth;
			const viewWorldTranslationY = this.viewTranslationVector[1] * worldHeight;

			const newCenterX = this.center[0] + viewWorldTranslationX;
			const newCenterY = this.center[1] + viewWorldTranslationY;

			const newZoom = this.zoom + this.viewZoom;

			this.#buildWorker.postMessage(
				{
					type: 'build', 
					data: {
						zoom: newZoom, 
						center: [newCenterX, newCenterY], 
						maxIterations: this.maxIterations, 
						viewTranslationVector: [this.viewTranslationVector[0], this.viewTranslationVector[1]], 
						pixelsPerPoint: this.pixelsPerPoint
					}
				}
			);
		} else {
			this.#skippedNewBuild = true;
		}
	}
	
	#drawScene() {
		this.gl.viewport(0, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
	
		// set clear color to black, fully opaque
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
		// clear buffer
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	
		const color = [0.7, 0.7, 0.7, 1.0];
	
	
		// set vertex data
		{
			const numComponents = 2;
			const type = this.gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
			this.gl.vertexAttribPointer(
				this.#attribLocations.vertexPosition, 
				numComponents, 
				type, 
				normalize, 
				stride, 
				offset
			);
			this.gl.enableVertexAttribArray(this.#attribLocations.vertexPosition);
		}
		{
			const numComponents = 2;
			const type = this.gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#texCoordBuffer);
			this.gl.vertexAttribPointer(
				this.#attribLocations.texCoords, 
				numComponents, 
				type, 
				normalize, 
				stride, 
				offset
			);
			this.gl.enableVertexAttribArray(this.#attribLocations.texCoords);
		}
	
	
		this.gl.useProgram(this.program);
		
		// set uniforms
		this.gl.uniform2fv(this.#uniformLocations.scalingFactor, this.viewScalingFactor);
		this.gl.uniform2fv(this.#uniformLocations.translationVector, this.viewTranslationVector);
	
		this.gl.uniform4fv(this.#uniformLocations.color, color);
	
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.#currTex);
		this.gl.uniform1i(this.#uniformLocations.uSampler, 0);
	
		{
			const offset = 0;
			const vertexCount = 4
			this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
		}
	}

	printPos(posX, posY) {
		console.log({
			screen: [posX, posY], 
			world: [
				(posX - this.canvas.clientWidth / 2) / this.#getZoom() + this.center[0], 
				(posY - this.canvas.clientHeight / 2) / this.#getZoom() + this.center[1]
			]
		});
	}

	#resizeCalcBuffer() {
		this.#buildWorker.postMessage({ type: 'resize', data: { width: Math.floor(this.canvas.width / this.pixelsPerPoint), height: Math.floor(this.canvas.height / this.pixelsPerPoint) } });
		//this.#buildWorker.postMessage({ type: 'resize', data: { width: this.canvas.width, height: this.canvas.height } });
	}

	#updateBounds() {
		this.#mandelbrotBounds.minX = (-this.canvas.clientWidth / 2) / this.#getZoom() + this.center[0];
		this.#mandelbrotBounds.maxX = (this.canvas.clientWidth / 2) / this.#getZoom() + this.center[0];
		this.#mandelbrotBounds.minY = (-this.canvas.clientHeight / 2) / this.#getZoom() + this.center[1];
		this.#mandelbrotBounds.maxY = (this.canvas.clientHeight / 2) / this.#getZoom() + this.center[1];
	}

	#loadTexture(image, width, height) {
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	
		const level = 0;
		const internalFormat = this.gl.RGBA;
		//const width = 1;
		//const height = 1;
		const border = 0;
		const srcFormat = this.gl.RGBA;
		const srcType = this.gl.UNSIGNED_BYTE;
		//const pixel = new Uint8Array(image.flat());
	
		this.gl.texImage2D(
			this.gl.TEXTURE_2D, 
			level, 
			internalFormat, 
			width, 
			height, 
			border, 
			srcFormat, 
			srcType, 
			image
		);
	
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	
		return texture;
	}

	#getZoom(z) {
		if (z === undefined) {
			z = this.zoom;
		}
	
		return Math.pow(1.5, z);
	}

	#loadLocations() {
		this.#attribLocations = {
			vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'), 
			texCoords: this.gl.getAttribLocation(this.program, 'aTexCoords'), 
		};

		this.#uniformLocations = {
			uSampler: this.gl.getUniformLocation(this.program, 'uSampler'), 
			color: this.gl.getUniformLocation(this.program, 'uColor'), 
			scalingFactor: this.gl.getUniformLocation(this.program, 'uScalingFactor'), 
			translationVector: this.gl.getUniformLocation(this.program, 'uTranslationVector'), 
		};
	}

	#initBuffers() {
		// position buffer
		const positions = [
			1.0, 1.0, 
			-1.0, 1.0, 
			1.0, -1.0, 
			-1.0, -1.0
		];

		this.#positionBuffer = this.initBuffer(positions);
	

		// texture coords buffer
		const texCoords = [
			1.0, 1.0, 
			0.0, 1.0, 
			1.0, 0.0, 
			0.0, 0.0
		];
		
		this.#texCoordBuffer = this.initBuffer(texCoords);
	}
}