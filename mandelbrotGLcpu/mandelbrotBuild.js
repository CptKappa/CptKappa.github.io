function HSBToRGB(h, s, b) {
	const k = (n) => (n + h / 60) % 6;
	const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
	return [255 * f(5), 255 * f(3), 255 * f(1)];
}

function calcMandelbrot(x0, y0, max_iterations) {
	let iteration = 0;

	let x = 0.0;
	let y = 0.0;
	let x2 = 0.0;
	let y2 = 0.0;

	while (x2 + y2 <= 4 && iteration < max_iterations) {
		y = (x + x) * y + y0;
		x = x2 - y2 + x0;
		x2 = x * x;
		y2 = y * y;
		iteration++;
	}

	return iteration;
}

function buildMandelbrot(buffer, width, height, zoom, center, maxIterations) {
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {

			const x0 = (i - width / 2) / zoom + center[0];
			const y0 = (j - height / 2) / zoom + center[1];

			const iterations = calcMandelbrot(x0, y0, maxIterations);
			
			const c = HSBToRGB(iterations / maxIterations * 255, 1.0, iterations < maxIterations ? 1.0 : 0.0);
			c.push(255);
			
			buffer[j * width + i] = c;
			//buffers[backbuffer].set(i, j, color(Math.pow(iterations / maxIterations * 360, 1.5) % 360, 1.0, 1-iterations / maxIterations));
		}
	}
}

function getZoom(z) {
	return Math.pow(1.5, z);
}