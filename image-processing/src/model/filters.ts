import { Mat } from '@techstark/opencv-js';
import { v4 as uuidv4 } from 'uuid';
import { GlfxCanvas } from '../glfx/lib';
import * as cv from '@techstark/opencv-js';

export type FilterParameterSpec = { name: string } & ( NumberParameterSpec | ColorParameterSpec | ChoiceParameterSpec );
export type NumberParameterSpec = {
    type: 'number',
    default: number,
    min: number,
    max: number,
    step: number,
    formatter?: (val: number) => string,
}
export type ColorParameterSpec = {
    type: 'color',
    default: [number, number, number]
}
export type ChoiceParameterSpec = {
    type: 'choice',
    default: string,
    choices: string[],
}

export type ValueType = 'image' | 'contours' | 'contour' | 'point' | 'raw';

export type Value =
    {
        type: 'image',
        source: HTMLCanvasElement | HTMLVideoElement,
    } |
    {
        type: 'contours',
        contours: Mat,
        hierarchy: Mat,
    } |
    {
        type: 'contour',
        contour: Mat,
    } |
    {
        type: 'point',
        point: { x: number, y: number },
    } |
    {
        type: 'raw',
        data: any,
    }

export type Operation =
    {
        type: 'glfx',
        apply: (canvas: GlfxCanvas, parameterValues: {[parameterName: string]: any}) => void;
    } |
    {
        type: 'value',
        apply: (input: Value, parameterValues: {[parameterName: string]: any}) => Value;
    }

export interface FilterSpec {
    name: string,
    inputType: ValueType,
    outputType: ValueType,
    parameters: FilterParameterSpec[],
    operation: Operation;
}

export const filterSpecs: FilterSpec[] = [
    {
        name: 'Brightness & contrast',
        inputType: 'image',
        outputType: 'image',
        parameters: [
            {
                name: 'Brightness',
                type: 'number',
                default: 0, min: -1, max: 1, step: 0.01,
            },
            {
                name: 'Contrast',
                type: 'number',
                default: 0, min: -1, max: 1, step: 0.01,
            },
        ],
        operation: {
            type: 'glfx',
            apply: (canvas, parameterValues) => {
                canvas.brightnessContrast(parameterValues["Brightness"], parameterValues["Contrast"]);
            },
        },
    },
    {
        name: 'Saturation & hue',
        inputType: 'image',
        outputType: 'image',
        parameters: [
            {
                name: 'Saturation',
                type: 'number',
                default: 0, min: -1, max: 1, step: 0.01,
            },
            {
                name: 'Hue',
                type: 'number',
                default: 0, min: -1, max: 1, step: 0.01,
            },
        ],
        operation: {
            type: 'glfx',
            apply: (canvas, parameterValues) => {
                canvas.hueSaturation(parameterValues["Hue"], parameterValues["Saturation"]);
            },
        },
    },
    {
        name: 'Blur',
        inputType: 'image',
        outputType: 'image',
        parameters: [
            {
                name: 'Distance',
                type: 'number',
                default: 8, min: 0, max: 100, step: 1,
                formatter: (val: number) => `${val}px`
            },
        ],
        operation: {
            type: 'glfx',
            apply: (canvas, parameterValues) => {
                canvas.triangleBlur(parameterValues["Distance"]);
            },
        },
    },
    {
        name: 'Similar colors',
        inputType: 'image',
        outputType: 'image',
        parameters: [
            {
                name: 'Target color',
                type: 'color',
                default: [0.5, 0.5, 0.5],
            },
            {
                name: 'Distance threshold',
                type: 'number',
                default: 0.2, min: 0, max: 1, step: 0.01,
            }
        ],
        operation: {
            type: 'glfx',
            apply: (canvas, parameterValues) => {
                canvas.similar(parameterValues["Target color"], parameterValues["Distance threshold"]);
            },
        },
    },
    {
        name: 'Detect contours',
        inputType: 'image',
        outputType: 'contours',
        parameters: [
            // TODO
        ],
        operation: {
            type: 'value',
            apply: (value, parameterValues) => {
                if (value.type !== 'image') {
                    throw new Error('needs image input');
                }

                const { source } = value;

                // copy the source to the 2d canvas
                // TODO: skip if already 2d canvas?
                // TODO: reuse resources?
                const canvas2d = document.createElement('canvas');
                canvas2d.width = source.width;
                canvas2d.height = source.height;
                const ctx = canvas2d.getContext("2d")!;
                ctx.drawImage(source, 0, 0);

                let src = cv.imread(canvas2d);
                // console.log(src.cols, src.rows);
                // // let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC4);
                // // copy the video canvas to the 2d canvas
                // ctx.scale(0.5,0.5) // todo oh no
                // ctx.drawImage(webcamRef.current.video, 0, 0);
                // let dst = cv.imread(canvas2d);
                // TODO: don't like this...
                cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
                cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();
                // You can try more different parameters
                cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
                return {
                    type: 'contours',
                    contours,
                    hierarchy
                }
            }
        }
    },
    {
        name: 'Largest contour',
        inputType: 'contours',
        outputType: 'contour',
        parameters: [
            {
                name: 'Method',
                type: 'choice',
                default: 'area',
                choices: ['area', 'radius'],
            },
        ],
        operation: {
            type: 'value',
            apply: (value, parameterValues) => {
                if (value.type !== 'contours') {
                    throw new Error('needs contours input');
                }

                const { contours } = value;

                let largestContour: Mat | undefined = undefined;
                let largestSize = -Infinity;

                for (let i = 0; i < (contours.size() as any as number); i++) {
                    const contour = contours.get(i);

                    let size;
                    if (parameterValues["Method"] === 'area') {
                        size = cv.contourArea(contour);
                    } else if (parameterValues["Method"] === 'radius') {
                        const {radius}: {center: {x: number, y: number}, radius: number} = (cv.minEnclosingCircle as any)(contour)
                        size = radius;
                    } else {
                        throw new Error(`unknown contour sizing method: ${parameterValues["Method"]}`);
                    }

                    if (size > largestSize) {
                        largestSize = size;
                        largestContour = contour;
                    }
                }

                if (!largestContour) {
                    throw new Error('no contours');
                }

                return {
                    type: 'contour',
                    contour: largestContour,
                }
            }
        }
    },
    {
        name: 'Center of contour',
        inputType: 'contour',
        outputType: 'point',
        parameters: [
            {
                name: 'Method',
                type: 'choice',
                default: 'center of mass',
                choices: ['center of mass', 'center of enclosing circle'],
            },
        ],
        operation: {
            type: 'value',
            apply: (value, parameterValues) => {
                if (value.type !== 'contour') {
                    throw new Error('needs contour input');
                }

                const { contour } = value;

                if (parameterValues["Method"] === 'center of mass') {
                    let m = cv.moments(contour);
                    return {type: 'point', point: {x: m.m10 / m.m00, y: m.m01 / m.m00}};
                } else if (parameterValues["Method"] === 'center of enclosing circle') {
                    const {center}: {center: {x: number, y: number}, radius: number} = (cv.minEnclosingCircle as any)(contour)
                    return {type: 'point', point: center}
                } else {
                    throw new Error(`unknown contour sizing method: ${parameterValues["Method"]}`);
                }
            }
        }
    }
]

export function filterSpecByName(name: string): FilterSpec {
    const filterSpec = filterSpecs.find((spec) => spec.name === name);
    if (!filterSpec) { throw new Error(`cannot find spec named ${name}`); }
    return filterSpec;
}

export interface FilterUse {
    id: string,
    specName: string,
    parameterValues: {[parameterName: string]: any},
}

export function newFilterUse(specName: string): FilterUse {
    const spec = filterSpecByName(specName);
    return {
        id: uuidv4(),
        specName: spec.name,
        parameterValues: Object.fromEntries(spec.parameters.map((parameter) => [parameter.name, parameter.default])),
    }
}

export type FilterChain = FilterUse[];
