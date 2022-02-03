import { v4 as uuidv4 } from 'uuid';

export type FilterParameterSpec =
    {
        name: string
    } &
    (
        NumberParameterSpec |
        {
            type: 'color',
            default: [number, number, number]
        }
    );

export type NumberParameterSpec = {
    type: 'number',
    default: number
    min: number,
    max: number,
    step: number,
    formatter?: (val: number) => string,
}

export interface FilterSpec {
    name: string,
    parameters: FilterParameterSpec[],
    operation: (input: any, parameterValues: {[parameterName: string]: any}) => any;
}

export const filterSpecs: FilterSpec[] = [
    {
        name: 'Brightness & contrast',
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
        operation: (input, parameterValues) => {
            return input.brightnessContrast(parameterValues["Brightness"], parameterValues["Contrast"]);
        },
    },
    {
        name: 'Saturation & hue',
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
        operation: (input, parameterValues) => {
            return input.hueSaturation(parameterValues["Hue"], parameterValues["Saturation"]);
        },
    },
    {
        name: 'Blur',
        parameters: [
            {
                name: 'Distance',
                type: 'number',
                default: 8, min: 0, max: 100, step: 1,
                formatter: (val: number) => `${val}px`
            },
        ],
        operation: (input, parameterValues) => {
            return input.triangleBlur(parameterValues["Distance"]);
        },
    },
    {
        name: 'Similar colors',
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
        operation: (input, parameterValues) => {
            return input.similar(parameterValues["Target color"], parameterValues["Distance threshold"]);
        },
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