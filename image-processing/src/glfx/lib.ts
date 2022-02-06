import { canvas as _canvas } from './core/canvas';

export type GlfxSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

export interface GlfxCanvas extends HTMLCanvasElement {
    texture: (source: GlfxSource) => GlfxTexture,
    draw: (texture: GlfxTexture) => GlfxCanvas,
}

export interface GlfxTexture {
    loadContentsOf: (source: GlfxSource) => void,
    destroy: () => void,
}

export const canvas: () => GlfxCanvas = _canvas as any;