import { canvas as _canvas } from './core/canvas';
import brightnessContrast from './filters/adjust/brightnesscontrast';
import hueSaturation from './filters/adjust/huesaturation';
import triangleBlur from './filters/blur/triangleblur';
import erodeDilate from './filters/blur/erodedilate';
import similar from './filters/similar';

export type GlfxSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

export interface GlfxCanvas extends HTMLCanvasElement {
    texture: (source: GlfxSource) => GlfxTexture,
    draw: (texture: GlfxTexture) => GlfxCanvas,
    update: () => GlfxCanvas,

    brightnessContrast: typeof brightnessContrast,
    hueSaturation: typeof hueSaturation,
    triangleBlur: typeof triangleBlur,
    erodeDilate: typeof erodeDilate,
    similar: typeof similar,
}

export interface GlfxTexture {
    loadContentsOf: (source: GlfxSource) => void,
    destroy: () => void,
}

export const canvas: () => GlfxCanvas = _canvas as any;