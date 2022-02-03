export const Shader = (function() {
    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }

    function isNumber(obj) {
        return Object.prototype.toString.call(obj) == '[object Number]';
    }

    function compileSource(type, source) {
        var shader = window.gl.createShader(type);
        window.gl.shaderSource(shader, source);
        window.gl.compileShader(shader);
        if (!window.gl.getShaderParameter(shader, window.gl.COMPILE_STATUS)) {
            throw 'compile error: ' + window.gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    var defaultVertexSource = '\
    attribute vec2 vertex;\
    attribute vec2 _texCoord;\
    varying vec2 texCoord;\
    void main() {\
        texCoord = _texCoord;\
        gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);\
    }';

    var defaultFragmentSource = '\
    uniform sampler2D texture;\
    varying vec2 texCoord;\
    void main() {\
        gl_FragColor = texture2D(texture, texCoord);\
    }';

    function Shader(vertexSource, fragmentSource) {
        this.vertexAttribute = null;
        this.texCoordAttribute = null;
        this.program = window.gl.createProgram();
        vertexSource = vertexSource || defaultVertexSource;
        fragmentSource = fragmentSource || defaultFragmentSource;
        fragmentSource = 'precision highp float;' + fragmentSource; // annoying requirement is annoying
        window.gl.attachShader(this.program, compileSource(window.gl.VERTEX_SHADER, vertexSource));
        window.gl.attachShader(this.program, compileSource(window.gl.FRAGMENT_SHADER, fragmentSource));
        window.gl.linkProgram(this.program);
        if (!window.gl.getProgramParameter(this.program, window.gl.LINK_STATUS)) {
            throw 'link error: ' + window.gl.getProgramInfoLog(this.program);
        }
    }

    Shader.prototype.destroy = function() {
        window.gl.deleteProgram(this.program);
        this.program = null;
    };

    Shader.prototype.uniforms = function(uniforms) {
        window.gl.useProgram(this.program);
        for (var name in uniforms) {
            if (!uniforms.hasOwnProperty(name)) continue;
            var location = window.gl.getUniformLocation(this.program, name);
            if (location === null) continue; // will be null if the uniform isn't used in the shader
            var value = uniforms[name];
            if (isArray(value)) {
                switch (value.length) {
                    case 1: window.gl.uniform1fv(location, new Float32Array(value)); break;
                    case 2: window.gl.uniform2fv(location, new Float32Array(value)); break;
                    case 3: window.gl.uniform3fv(location, new Float32Array(value)); break;
                    case 4: window.gl.uniform4fv(location, new Float32Array(value)); break;
                    case 9: window.gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                    case 16: window.gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                    default: throw 'dont\'t know how to load uniform "' + name + '" of length ' + value.length;
                }
            } else if (isNumber(value)) {
                window.gl.uniform1f(location, value);
            } else {
                throw 'attempted to set uniform "' + name + '" to invalid value ' + (value || 'undefined').toString();
            }
        }
        // allow chaining
        return this;
    };

    // textures are uniforms too but for some reason can't be specified by window.gl.uniform1f,
    // even though floating point numbers represent the integers 0 through 7 exactly
    Shader.prototype.textures = function(textures) {
        window.gl.useProgram(this.program);
        for (var name in textures) {
            if (!textures.hasOwnProperty(name)) continue;
            window.gl.uniform1i(window.gl.getUniformLocation(this.program, name), textures[name]);
        }
        // allow chaining
        return this;
    };

    Shader.prototype.drawRect = function(left, top, right, bottom) {
        var undefined;
        var viewport = window.gl.getParameter(window.gl.VIEWPORT);
        top = top !== undefined ? (top - viewport[1]) / viewport[3] : 0;
        left = left !== undefined ? (left - viewport[0]) / viewport[2] : 0;
        right = right !== undefined ? (right - viewport[0]) / viewport[2] : 1;
        bottom = bottom !== undefined ? (bottom - viewport[1]) / viewport[3] : 1;
        if (window.gl.vertexBuffer == null) {
            window.gl.vertexBuffer = window.gl.createBuffer();
        }
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, window.gl.vertexBuffer);
        window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array([ left, top, left, bottom, right, top, right, bottom ]), window.gl.STATIC_DRAW);
        if (window.gl.texCoordBuffer == null) {
            window.gl.texCoordBuffer = window.gl.createBuffer();
            window.gl.bindBuffer(window.gl.ARRAY_BUFFER, window.gl.texCoordBuffer);
            window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), window.gl.STATIC_DRAW);
        }
        if (this.vertexAttribute == null) {
            this.vertexAttribute = window.gl.getAttribLocation(this.program, 'vertex');
            window.gl.enableVertexAttribArray(this.vertexAttribute);
        }
        if (this.texCoordAttribute == null) {
            this.texCoordAttribute = window.gl.getAttribLocation(this.program, '_texCoord');
            window.gl.enableVertexAttribArray(this.texCoordAttribute);
        }
        window.gl.useProgram(this.program);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, window.gl.vertexBuffer);
        window.gl.vertexAttribPointer(this.vertexAttribute, 2, window.gl.FLOAT, false, 0, 0);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, window.gl.texCoordBuffer);
        window.gl.vertexAttribPointer(this.texCoordAttribute, 2, window.gl.FLOAT, false, 0, 0);
        window.gl.drawArrays(window.gl.TRIANGLE_STRIP, 0, 4);
    };

    Shader.getDefaultShader = function() {
        window.gl.defaultShader = window.gl.defaultShader || new Shader();
        return window.gl.defaultShader;
    };

    return Shader;
})();

export function warpShader(uniforms, warp) {
    return new Shader(null, uniforms + '\
    uniform sampler2D texture;\
    uniform vec2 texSize;\
    varying vec2 texCoord;\
    void main() {\
        vec2 coord = texCoord * texSize;\
        ' + warp + '\
        gl_FragColor = texture2D(texture, coord / texSize);\
        vec2 clampedCoord = clamp(coord, vec2(0.0), texSize);\
        if (coord != clampedCoord) {\
            /* fade to transparent if we are outside the image */\
            gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));\
        }\
    }');
}