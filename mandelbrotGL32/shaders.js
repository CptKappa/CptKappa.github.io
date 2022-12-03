function getVertexShader() {
	return `
		attribute vec2 aVertexPosition;
		attribute vec2 aVertexMandelPosition;

		uniform vec2 uScalingFactor;
		uniform vec2 uTranslationVector;

		uniform vec2 uAspect;

		varying vec2 vMandelPosition;

		void main() {
			gl_Position = vec4(aVertexPosition, 0.0, 1.0);
			vMandelPosition = aVertexMandelPosition * uAspect / uScalingFactor + uTranslationVector;
		}
	`;
}

function getFragmentShader() {
	return `
		precision highp float;

		varying vec2 vMandelPosition;
		uniform vec4 color;

		const int maxIterations = 100;

		// All components are in the range [0…1], including hue.
		vec3 rgb2hsv(vec3 c) {
			vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
			vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
			vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

			float d = q.x - min(q.w, q.y);
			float e = 1.0e-10;
			return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
		}

		// All components are in the range [0…1], including hue.
		vec3 hsv2rgb(vec3 c) {
			vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
			vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
			return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
		}
		
		void main() {
			int iteration = 0;
			
			float x = 0.0;
			float y = 0.0;
			float x2 = 0.0;
			float y2 = 0.0;
			
			for (int i = 0; i <= maxIterations; i += 1) {
				if (x2 + y2 > 4.0) {
					break;
				}
				y = (x + x) * y + vMandelPosition.y;
				x = x2 - y2 + vMandelPosition.x;
				x2 = x * x;
				y2 = y * y;
				iteration = i;
			}
		
			float ratio = float(iteration) / float(maxIterations);

			vec3 rgb = hsv2rgb(vec3(ratio, 1.0, 1.0-floor(ratio)));
			gl_FragColor = vec4(rgb.xyz, 1.0);
			//gl_FragColor = vec4(0.0, 0.0, 0.0, ratio);
			//gl_FragColor = vec4(vMandelPosition.xy, 0.0, 1.0);
			//gl_FragColor = color;
		}
	`;
}

export { getVertexShader, getFragmentShader };