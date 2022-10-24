import * as shaders from './shaders.js'

function getShaders() {
	return shaders;
}

function getProgramInfo(gl, program) {
	return {
		program: program, 
		attribLocations: {
			vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'), 
			vertexMandelPosition: gl.getAttribLocation(program, 'aVertexMandelPosition'), 
		}, 
		uniformLocations: {
			scalingFactor: gl.getUniformLocation(program, 'uScalingFactor'), 
			translationVector: gl.getUniformLocation(program, 'uTranslationVector'), 
			color: gl.getUniformLocation(program, 'uColor'), 
		}, 
	};
}

function initMandelBuffers(gl, mandelBounds) {
	const mandelPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mandelPosBuffer);

	const mandelPos = [
		mandelBounds.maxX, mandelBounds.maxY, 
		mandelBounds.minX, mandelBounds.maxY, 
		mandelBounds.maxX, mandelBounds.minY, 
		mandelBounds.minX, mandelBounds.minY
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mandelPos), gl.STATIC_DRAW);

	return mandelPosBuffer;
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
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mandelPosition);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexMandelPosition, 
			numComponents, 
			type, 
			normalize, 
			stride, 
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexMandelPosition);
	}
}

export { getShaders, getProgramInfo, initMandelBuffers, setSceneAttribs }