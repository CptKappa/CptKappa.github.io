function getVertexShader() {
	return `
		attribute vec2 aVertexPosition;
		attribute vec2 aVertexMandelPositionX;
		attribute vec2 aVertexMandelPositionY;

		uniform vec2 uScalingFactor;
		uniform vec2 uTranslationVector;

		varying vec2 vMandelPositionX;
		varying vec2 vMandelPositionY;
		
		vec2 twoSum(float a, float b) {
			float s = a + b;
			float v = s - a;
			float e = (a - (s - v)) + (b - v);
			return vec2(s, e);
		}

		vec2 quickTwoSum(float a, float b) {
			float s = a + b;
			float e = b - (s - a);
			return vec2(s, e);
		}

		/**
		 * df64 + float
		 */
		vec2 df64_add(vec2 a, float b) {
			vec2 s;
			s = twoSum(a.x, b);
			s.y += a.y;
			s = quickTwoSum(s.x, s.y);
			return s;
		}

		vec4 twoDiffComp(vec2 a_ri, vec2 b_ri) {
		
			vec2 s = a_ri - b_ri;
			vec2 v = s - a_ri;
			vec2 err = (a_ri - (s - v)) - (b_ri + v);
			return vec4(s.x, err.x, s.y, err.y);
		}

		/**
		 * the above _diff method can be improved using the twoDiffComp()
		 * to do the two twodiff() calls simultaneously
		 */
		vec2 df64_diff(vec2 a, vec2 b) {
		
			vec4 st;
			st = twoDiffComp(a, b);
			st.y += st.z;
			st.xy = quickTwoSum(st.x, st.y);
			st.y += st.w;
			st.xy = quickTwoSum(st.x, st.y);

			return st.xy;
		}

		vec2 split(float a) {
			const float split = 4097.0; // (1 << 12) + 1;	
			float t = a * split;
			float a_hi = t - (t - a);
			float a_lo = a - a_hi;
			
			return vec2(a_hi, a_lo);
		}

		vec2 twoProd(float a, float b) {
			float p = a * b;
			vec2 aS = split(a);
			vec2 bS = split(b);
			float err = ((aS.x * bS.x - p) + aS.x * bS.y + aS.y * bS.x) + aS.y * bS.y;

			return vec2(p, err);
		}

		/**
		 * similar to above, but A only specified to f32 precision
		 */
		vec2 df64_div(vec2 B, float A) {
			
			float xn = 1.0 / A;
			float yn = B.x * xn;
			float diffTerm = (df64_diff(B, twoProd(A, yn))).x;
			vec2 prodTerm = twoProd(xn, diffTerm);
			
			return df64_add(prodTerm, yn);
		}

		void main() {
			gl_Position = vec4(aVertexPosition, 0.0, 1.0);
			vMandelPositionX = df64_add(df64_div(aVertexMandelPositionX, uScalingFactor.x), uTranslationVector.x);
			vMandelPositionY = df64_add(df64_div(aVertexMandelPositionY, uScalingFactor.y), uTranslationVector.y);
		}
	`;
}

function getFragmentShader() {
	return `
		precision highp float;

		varying vec2 vMandelPositionX;
		varying vec2 vMandelPositionY;
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



		vec4 twoSumComp(vec2 a_ri, vec2 b_ri) {
			vec2 s = a_ri + b_ri;
			vec2 v = s - a_ri;
			// xxAT Should be a ONE* here on s?
			vec2 e = (a_ri - (s - v)) + (b_ri - v);
			return vec4(s.x, e.x, s.y, e.y);
		}

		vec2 quickTwoSum(float a, float b) {
			float s = a + b;
			float e = b - (s - a);
			return vec2(s, e);
		}

		/** same as above but uses twoSumComp() to perform both
		 *   twoSum() ops at the same time
		 */
		vec2 df64_add(vec2 a, vec2 b) {
		
			vec4 st;
			st = twoSumComp(a, b);
			st.y += st.z;
			st.xy = quickTwoSum(st.x, st.y);
			st.y += st.w;
			st.xy = quickTwoSum(st.x, st.y);

			return st.xy;
		}

		/**
		 * the following splits a 24-bit IEEE floating point mantissa+E
		 * into two numbers hi and low such that a = hi + low.  hi
		 * will contain the first 12 bits, and low will contain the lower
		 * order 12 bits.
		 */
		vec2 split(float a) {

			const float split = 4097.0; // (1 << 12) + 1;	
			float t = a*split;
			float a_hi = t - (t - a);
			float a_lo = a - a_hi;
			
			return vec2(a_hi, a_lo);
		}

		vec2 twoProd(float a, float b) {
			float p = a * b;
			vec2 aS = split(a);
			vec2 bS = split(b);
			float err = ((aS.x * bS.x - p) + aS.x * bS.y + aS.y * bS.x) + aS.y * bS.y;
			return vec2(p, err);
		}

		/* double-float * double-float */
		vec2 df64_mult(vec2 a, vec2 b) {
			vec2 p;
			p = twoProd(a.x, b.x);
			p.y += a.x * b.y;
			p.y += a.y * b.x;
			p = quickTwoSum(p.x, p.y);

			return p;
		}

		vec4 twoDiffComp(vec2 a_ri, vec2 b_ri) {
			vec2 s = a_ri - b_ri;
			vec2 v = s - a_ri;
			vec2 err = (a_ri - (s - v)) - (b_ri + v);

			return vec4(s.x, err.x, s.y, err.y);
		}

		/**
		 * the above _diff method can be improved using the twoDiffComp()
		 * to do the two twodiff() calls simultaneously
		 */
		vec2 df64_diff(vec2 a, vec2 b) {
		
			vec4 st;
			st = twoDiffComp(a, b);
			st.y += st.z;
			st.xy = quickTwoSum(st.x, st.y);
			st.y += st.w;
			st.xy = quickTwoSum(st.x, st.y);

			return st.xy;
		}
		
		// dfReal > float
		bool df64_gt(vec2 a, float b) {
			return (a.x > b || (a.x == b && a.y > 0.0));
		}
		
		void main() {
			int iteration = 0;
			
			vec2 x = vec2(0.0, 0.0);
			vec2 y = vec2(0.0, 0.0);
			vec2 x2 = vec2(0.0, 0.0);
			vec2 y2 = vec2(0.0, 0.0);
			
			for (int i = 0; i <= maxIterations; i += 1) {
				if (df64_gt(df64_add(x2, y2), 4.0)) {
					break;
				}
				y = df64_add(df64_mult(df64_add(x, x), y), vMandelPositionY);
				x = df64_add(df64_diff(x2, y2), vMandelPositionX);
				x2 = df64_mult(x, x);
				y2 = df64_mult(y, y);
				iteration = i;
			}
		
			float ratio = float(iteration) / float(maxIterations);

			vec3 rgb = hsv2rgb(vec3(ratio, 1.0, 1.0-floor(ratio)));
			gl_FragColor = vec4(rgb.xyz, 1.0);
			//gl_FragColor = vec4(0.0, 0.0, 0.0, ratio);
			//gl_FragColor = vec4(vMandelPositionX.x, vMandelPositionY.x, 0.0, 1.0);
			//gl_FragColor = color;
		}
	`;
}

export { getVertexShader, getFragmentShader };