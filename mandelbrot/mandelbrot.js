function calcMandelbrot(x0, y0, max_iterations) {
	let iteration = 0;
	const threshold = 2*2;

	// z = x + yi
	// z^2 = x^2 + 2xyi - y^2
	// c = x0 + y0i

	let x = 0.0;
	let y = 0.0;

	let x_sq = x*x;
	let y_sq = y*y;
	while (x_sq + y_sq <= threshold && iteration < max_iterations) {
		const xtmp = x_sq - y_sq + x0;
		y = 2 * x * y + y0;
		x = xtmp;
		iteration++;

		x_sq = x*x;
		y_sq = y*y;
	}

	return iteration;
}

function calcMandelbrotOptimized(x0, y0, max_iterations) {
	let iteration = 0;

	let x = 0.0;
	let y = 0.0;
	let x2 = 0.0;
	let y2 = 0.0;

	while (x2 + y2 <= 4 && iteration < max_iterations) {
		y = (x * y) + (x * y) + y0;
		x = x2 - y2 + x0;
		x2 = x * x;
		y2 = y * y;
		iteration++;
	}

	return iteration;
}