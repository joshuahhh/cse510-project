import { Texture } from './texture';
import { Shader } from './shader';

import triangleBlur from './../filters/blur/triangleblur'
import brightnessContrast from './../filters/adjust/brightnesscontrast'
import hueSaturation from './../filters/adjust/huesaturation'
import similar from './../filters/similar'
import curves, { splineInterpolate } from './../filters/adjust/curves'

function wrapTexture(texture) {
    return {
        _: texture,
        loadContentsOf: function(element) {
            // Make sure that we're using the correct global WebGL context
            window.gl = this._.gl;
            this._.loadContentsOf(element);
        },
        destroy: function() {
            // Make sure that we're using the correct global WebGL context
            window.gl = this._.gl;
            this._.destroy();
        }
    };
}

function texture(element) {
    return wrapTexture(Texture.fromElement(element));
}

function initialize(width, height) {
    var type = window.gl.UNSIGNED_BYTE;

    // Go for floating point buffer textures if we can, it'll make the bokeh
    // filter look a lot better. Note that on Windows, ANGLE does not let you
    // render to a floating-point texture when linear filtering is enabled.
    // See https://crbug.com/172278 for more information.
    if (window.gl.getExtension('OES_texture_float') && window.gl.getExtension('OES_texture_float_linear')) {
        var testTexture = new Texture(100, 100, window.gl.RGBA, window.gl.FLOAT);
        try {
            // Only use window.gl.FLOAT if we can render to it
            testTexture.drawTo(function() { type = window.gl.FLOAT; });
        } catch (e) {
        }
        testTexture.destroy();
    }

    if (this._.texture) this._.texture.destroy();
    if (this._.spareTexture) this._.spareTexture.destroy();
    this.width = width;
    this.height = height;
    this._.texture = new Texture(width, height, window.gl.RGBA, type);
    this._.spareTexture = new Texture(width, height, window.gl.RGBA, type);
    this._.extraTexture = this._.extraTexture || new Texture(0, 0, window.gl.RGBA, type);
    this._.flippedShader = this._.flippedShader || new Shader(null, '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y));\
        }\
    ');
    this._.isInitialized = true;
}

/*
   Draw a texture to the canvas, with an optional width and height to scale to.
   If no width and height are given then the original texture width and height
   are used.
*/
function draw(texture, width, height) {
    if (!this._.isInitialized || texture._.width != this.width || texture._.height != this.height) {
        initialize.call(this, width ? width : texture._.width, height ? height : texture._.height);
    }

    texture._.use();
    this._.texture.drawTo(function() {
        Shader.getDefaultShader().drawRect();
    });

    return this;
}

function update() {
    this._.texture.use();
    this._.flippedShader.drawRect();
    return this;
}

function replace(node) {
    node.parentNode.insertBefore(this, node);
    node.parentNode.removeChild(node);
    return this;
}

function contents() {
    var texture = new Texture(this._.texture.width, this._.texture.height, window.gl.RGBA, window.gl.UNSIGNED_BYTE);
    this._.texture.use();
    texture.drawTo(function() {
        Shader.getDefaultShader().drawRect();
    });
    return wrapTexture(texture);
}

/*
   Get a Uint8 array of pixel values: [r, g, b, a, r, g, b, a, ...]
   Length of the array will be width * height * 4.
*/
function getPixelArray() {
    var w = this._.texture.width;
    var h = this._.texture.height;
    var array = new Uint8Array(w * h * 4);
    this._.texture.drawTo(function() {
        window.gl.readPixels(0, 0, w, h, window.gl.RGBA, window.gl.UNSIGNED_BYTE, array);
    });
    return array;
}

function wrap(func) {
    return function() {
        // Make sure that we're using the correct global WebGL context
        window.gl = this._.gl;

        // Now that the context has been switched, we can call the wrapped function
        return func.apply(this, arguments);
    };
}

export function canvas() {
    var canvas = document.createElement('canvas');
    try {
        window.gl = canvas.getContext('experimental-webgl', { premultipliedAlpha: false });
    } catch (e) {
        window.gl = null;
    }
    if (!window.gl) {
        throw 'This browser does not support WebGL';
    }
    canvas._ = {
        gl: window.gl,
        isInitialized: false,
        texture: null,
        spareTexture: null,
        flippedShader: null
    };

    // Core methods
    canvas.texture = wrap(texture);
    canvas.draw = wrap(draw);
    canvas.update = wrap(update);
    canvas.replace = wrap(replace);
    canvas.contents = wrap(contents);
    canvas.getPixelArray = wrap(getPixelArray);

    // Filter methods
    canvas.brightnessContrast = wrap(brightnessContrast);
    // canvas.hexagonalPixelate = wrap(hexagonalPixelate);
    canvas.hueSaturation = wrap(hueSaturation);
    // canvas.colorHalftone = wrap(colorHalftone);
    canvas.triangleBlur = wrap(triangleBlur);
    // canvas.unsharpMask = wrap(unsharpMask);
    // canvas.perspective = wrap(perspective);
    // canvas.matrixWarp = wrap(matrixWarp);
    // canvas.bulgePinch = wrap(bulgePinch);
    // canvas.tiltShift = wrap(tiltShift);
    // canvas.dotScreen = wrap(dotScreen);
    // canvas.edgeWork = wrap(edgeWork);
    // canvas.lensBlur = wrap(lensBlur);
    // canvas.zoomBlur = wrap(zoomBlur);
    // canvas.noise = wrap(noise);
    // canvas.denoise = wrap(denoise);
    // canvas.curves = wrap(curves);
    // canvas.swirl = wrap(swirl);
    // canvas.ink = wrap(ink);
    // canvas.vignette = wrap(vignette);
    // canvas.vibrance = wrap(vibrance);
    // canvas.sepia = wrap(sepia);

    canvas.similar = wrap(similar);

    return canvas;
};
