import React from 'react';
import FilterChainRunner, { RunnerResults } from '../model/FilterChainRunner';
import { FilterUse, newFilterUse } from '../model/filters';
import ReactDOM from 'react-dom';
import FilterChainEditorEmbed from './FilterChainEditorEmbed';

interface GlobalState {
    runner: FilterChainRunner;
    input: HTMLVideoElement | HTMLCanvasElement;
    results: RunnerResults;
    mountingLocation: HTMLDivElement;
    filterChain: FilterUse[];
    showTool: boolean;
}

function getGlobalState(): GlobalState {
    let globalState: GlobalState = (window as any)._IMAGE_PROCESSING_TOOL_GLOBAL_STATE_;
    if (!globalState) {
        console.log("constructing global state");
        const mountingLocation = document.createElement('div');
        mountingLocation.classList.add("image-processing-tool-mounting-location");
        document.body.append(mountingLocation)

        const filterChain: FilterUse[] = [
            newFilterUse('Blur'),
            newFilterUse('Similar colors'),
            newFilterUse('Detect contours'),
            newFilterUse('Largest contour'),
            newFilterUse('Center of contour'),
        ]

        globalState = {
            filterChain,
            runner: new FilterChainRunner(),
            input: undefined as any,  // just fill it up fast, ok?
            results: undefined as any,  // same
            mountingLocation,
            showTool: false,
        };
        (window as any)._IMAGE_PROCESSING_TOOL_GLOBAL_STATE_ = globalState;
    }
    return globalState;
}

interface Props {
    input: HTMLCanvasElement | HTMLVideoElement;
    showTool?: boolean;
}

export function imageProcessingTool({input, showTool}: Props) {
    const globalState = getGlobalState();

    globalState.input = input;
    globalState.showTool = showTool || false;
    update();

    return globalState.results.final;
}

function update() {
    const globalState = getGlobalState();

    globalState.runner.filterChain = globalState.filterChain;
    globalState.results = globalState.runner.run({type: 'image', source: globalState.input});

    if (globalState.showTool) {
        ReactDOM.render(<FilterChainEditorEmbed
            filterChain={globalState.filterChain}
            setFilterChain={(newFilterChain) => {
                globalState.filterChain = newFilterChain;
                update();
            }}
            input={globalState.input} results={globalState.results}
        />, globalState.mountingLocation)
    } else {
        // TODO: what if it's not mounted yet?
        ReactDOM.unmountComponentAtNode(globalState.mountingLocation);
    }
}