function getVertexShader() {
	return `
		precision highp float;

		attribute vec2 aVertexPosition;
		attribute vec2 aTexCoords;

		varying vec2 vTexCoords;

		void main() {
			gl_Position = vec4(aVertexPosition, 0.0, 1.0);
			vTexCoords = aTexCoords;
		}
	`;
}

function getFragmentShader() {
	return `
		precision highp float;

		// [0.0, 1.0]
		varying vec2 vTexCoords;

		uniform vec4 uColor;

		uniform sampler2D uSampler;

		uniform vec2 uScalingFactor;
		// [-1.0, 1.0]
		uniform vec2 uTranslationVector;
		
		void main() {
			// [0.0, 1.0] -> [-1.0, 1.0]
			vec2 texCoordsSymmetrical = vTexCoords * 2.0 - 1.0;
			vec2 scaledTexCoordsSymmetrical = texCoordsSymmetrical / uScalingFactor;
			vec2 scaledTexCoords = (scaledTexCoordsSymmetrical + 1.0) / 2.0;
			// [-1.0, 1.0] -> [0.0, 1.0]
			vec2 adjustedTexCoords = scaledTexCoords + uTranslationVector;

			if (adjustedTexCoords.x >= 0.0 && adjustedTexCoords.x <= 1.0 && adjustedTexCoords.y >= 0.0 && adjustedTexCoords.y <= 1.0) {
				gl_FragColor = texture2D(uSampler, adjustedTexCoords);
			} else {
				gl_FragColor = uColor;
			}

			//gl_FragColor = texture2D(uSampler, adjustedTexCoords);
			//gl_FragColor = uColor;
		}
	`;
}

export { getVertexShader, getFragmentShader };