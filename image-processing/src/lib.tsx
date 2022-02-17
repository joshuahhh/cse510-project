import React from 'react';
import FilterChainRunner, { RunnerResults } from './model/FilterChainRunner';
import { FilterUse, newFilterUse } from './model/filters';
import ReactDOM from 'react-dom';
import FilterChainEditorEmbed from './view/FilterChainEditorEmbed';
import dims from './dims';

interface GlobalState {
    runner: FilterChainRunner;
    input: HTMLVideoElement | HTMLCanvasElement;
    results: RunnerResults;
    mountingLocation: HTMLDivElement;
    filterChain: FilterUse[];
    showTool: boolean;
    isMirrored: boolean;
}

const localStorageKey = 'image-processing-tool-filter-spec';

function getGlobalState(): GlobalState {
    let globalState: GlobalState = (window as any)._IMAGE_PROCESSING_TOOL_GLOBAL_STATE_;
    if (!globalState) {
        console.log("constructing global state");
        const mountingLocation = document.createElement('div');
        mountingLocation.classList.add("image-processing-tool-mounting-location");
        document.body.append(mountingLocation)

        let filterChain: FilterUse[] = []

        const filterChainJson = window.localStorage.getItem(localStorageKey)
        if (filterChainJson) {
            filterChain = JSON.parse(filterChainJson);
        }

        globalState = {
            filterChain,
            runner: new FilterChainRunner(),
            input: undefined as any,  // just fill it up fast, ok?
            results: undefined as any,  // same
            mountingLocation,
            showTool: false,
            isMirrored: true,
        };
        (window as any)._IMAGE_PROCESSING_TOOL_GLOBAL_STATE_ = globalState;
    }
    return globalState;
}

interface Props {
    input: HTMLCanvasElement | HTMLVideoElement;
    showTool?: boolean;
    isMirrored?: boolean;
}

export default function imageProcessingTool({input, showTool, isMirrored}: Props) {
    const globalState = getGlobalState();

    globalState.input = input;
    globalState.showTool = showTool ?? false;
    globalState.isMirrored = isMirrored ?? true;
    update();

    const value = globalState.results.final;

    // HACK: flip x values when mirrored
    if (globalState.isMirrored && value && value.type === 'point') {
        value.point.x = dims(input)[0] - value.point.x
    }

    return value;
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
                // TODO: If imageProcessingTool is being called in a fast loop, this creates choppy behavior.
                //       If it's being called in a slow loop, it's desired. What to do?
                // update();

                window.localStorage.setItem(localStorageKey, JSON.stringify(newFilterChain));
            }}
            input={globalState.input} results={globalState.results} isMirrored={globalState.isMirrored}
        />, globalState.mountingLocation)
    } else {
        // TODO: what if it's not mounted yet?
        ReactDOM.unmountComponentAtNode(globalState.mountingLocation);
    }
}