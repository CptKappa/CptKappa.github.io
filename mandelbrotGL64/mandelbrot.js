import * as shaders from './shaders.js'

function df64_split(a) {
	const splitter = Math.pow(2, 29) + 1;
	const t = a * splitter;
	const t_hi = t - (t - a);
	const t_lo = a - t_hi;

	return [ t_hi, t_lo ];
}

function df64_merge(a_hi, a_lo) {
	return a_hi + a_lo;
}

function getShaders() {
	return shaders;
}

function getProgramInfo(gl, program) {
	return {
		program: program, 
		attribLocations: {
			vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'), 
			vertexMandelPositionX: gl.getAttribLocation(program, 'aVertexMandelPositionX'), 
			vertexMandelPositionY: gl.getAttribLocation(program, 'aVertexMandelPositionY'), 
		}, 
		uniformLocations: {
			scalingFactor: gl.getUniformLocation(program, 'uScalingFactor'), 
			translationVector: gl.getUniformLocation(program, 'uTranslationVector'), 
			color: gl.getUniformLocation(program, 'uColor'), 
		}, 
	};
}

function initMandelBuffers(gl, mandelBounds) {
	const mandelPosXD64 = [
		mandelBounds.maxX, 
		mandelBounds.minX, 
		mandelBounds.maxX, 
		mandelBounds.minX, 
	];

	const mandelPosYD64 = [
		mandelBounds.maxY, 
		mandelBounds.maxY, 
		mandelBounds.minY, 
		mandelBounds.minY,
	];

	const mandelPosX = mandelPosXD64.map((v,i) => df64_split(v)).flat();
	const mandelPosY = mandelPosYD64.map((v,i) => df64_split(v)).flat();


	const mandelPosBufferX = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mandelPosBufferX);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mandelPosX), gl.STATIC_DRAW);
	

	const mandelPosBufferY = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mandelPosBufferY);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mandelPosY), gl.STATIC_DRAW);

	return {
		X: mandelPosBufferX, 
		Y: mandelPosBufferY, 
	}
}

function setSceneAttribs(gl, programInfo, buffers) {
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition, 
			numComponents, 
			type, 
			normalize, 
			stride, 
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
	}
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mandelPosition.X);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexMandelPositionX, 
			numComponents, 
			type, 
			normalize, 
			stride, 
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexMandelPositionX);
	}
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mandelPosition.Y);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexMandelPositionY, 
			numComponents, 
			type, 
			normalize, 
			stride, 
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexMandelPositionY);
	}
}

export { getShaders, getProgramInfo, initMandelBuffers, setSceneAttribs }