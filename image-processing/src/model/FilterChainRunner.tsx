import { FilterChain, filterSpecByName } from "./filters";
import * as glfx from '../glfx/lib'
import { GlfxCanvas, GlfxTexture } from "../glfx/lib";

// A FilterChain is the "spec of" / "code for" a filter chain. It gets serialized.
// A FilterChainRunner actually runs it. It also maintains runtime state so that a FilterChain can be run efficiently.

export default class FilterChainRunner {
    filterChain: FilterChain = []

    _glfxResourcesById: {[filterId: string]: GlfxResources} = {}

    run (video: HTMLVideoElement): HTMLVideoElement | HTMLCanvasElement {
        // TODO: better input
        let lastInput: HTMLVideoElement | HTMLCanvasElement = video;
        for (const filterUse of this.filterChain) {
            const glfxResources = this.updateGlfxResources(filterUse.id, lastInput);

            const filterSpec = filterSpecByName(filterUse.specName);
            const parameterValues = {...filterUse.parameterValues};
            for (const parameter of filterSpec.parameters) {
                if (!(parameter.name in parameterValues)) {
                parameterValues[parameter.name] = parameter.default;
                }
            }
            const input = glfxResources.canvas.draw(glfxResources.texture);
            const operation = filterSpec.operation;
            const output = operation(input, parameterValues);
            output.update();
            lastInput = glfxResources.canvas;
        }
        return lastInput;
    }

    updateGlfxResources(filterUseId: string, textureSource: HTMLVideoElement | HTMLCanvasElement): GlfxResources {
        let glfxResources = this._glfxResourcesById[filterUseId]
        if (!glfxResources) {
            const canvas = glfx.canvas();
            const texture = canvas.texture(textureSource);
            glfxResources = { canvas, texture };
            this._glfxResourcesById[filterUseId] = glfxResources;
        } else {
            try {
                glfxResources.texture.loadContentsOf(textureSource);
            } catch {
                console.log("trouble; let's go again")
                glfxResources.texture.destroy();
                delete this._glfxResourcesById[filterUseId];
                return this.updateGlfxResources(filterUseId, textureSource);
            }
        }
        return glfxResources;
    }

    getGlfxResources(filterUseId: string): GlfxResources | undefined {
        return this._glfxResourcesById[filterUseId];
    }
}

interface GlfxResources {
    canvas: GlfxCanvas,
    texture: GlfxTexture,
}