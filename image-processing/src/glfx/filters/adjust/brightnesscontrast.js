import { simpleShader } from "../common";
import { Shader } from '../../core/shader';
import { clamp } from '../common';

/**
 * @filter           Brightness / Contrast
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export default function brightnessContrast(brightness, contrast) {
    window.gl.brightnessContrast = window.gl.brightnessContrast || new Shader(null, '\
        uniform sampler2D texture;\
        uniform float brightness;\
        uniform float contrast;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            color.rgb += brightness;\
            if (contrast > 0.0) {\
                color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;\
            } else {\
                color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;\
            }\
            gl_FragColor = color;\
        }\
    ');

    simpleShader.call(this, window.gl.brightnessContrast, {
        brightness: clamp(-1, brightness, 1),
        contrast: clamp(-1, contrast, 1)
    });

    return this;
}
