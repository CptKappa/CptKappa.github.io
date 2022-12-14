importScripts('./mandelbrotBuild.js');

let buffer;
let width;
let height;

function resize(w, h) {
	width = w;
	height = h;
	buffer = Array(width * height);
}

self.addEventListener('message', (e) => {
	const { type, data } = e.data;

	if (type == 'resize') {
		resize(data.width, data.height);
	} else if (type == 'build') {
		const startTime = Date.now();

		buildMandelbrot(buffer, width, height, getZoom(data.zoom), data.center, data.maxIterations);

		buildTime = Date.now() - startTime;

		postMessage(
			{
				type: 'render', 
				data: { 
					buffer: new Uint8Array(buffer.flat()), 
					buildTime: buildTime, 
					usedWidth: width, 
					usedHeight: height, 
					usedZoom: data.zoom, 
					usedCenter: data.center, 
					usedMaxIterations: data.maxIterations, 
					usedViewTranslationVector: data.viewTranslationVector
				}
			}
		);
	}
});