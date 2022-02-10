import React from "react";
import { FilterUse, newFilterUse } from "../model/filters";
import Webcam from 'react-webcam';
import FilterChainEditorEmbed from "./FilterChainEditorEmbed";
import useInterval from "./useInterval";
import FilterChainRunner, { RunnerResults } from "../model/FilterChainRunner";

function DemoEmbedComponent() {
    const [filterChain, setFilterChain] = React.useState<FilterUse[]>([
        newFilterUse('Blur'),
        newFilterUse('Similar colors'),
        newFilterUse('Detect contours'),
        newFilterUse('Largest contour'),
        newFilterUse('Center of contour'),
    ])

    const [webcam, setWebcam] = React.useState<Webcam | null>(null);
    const [mspf, setMspf] = React.useState<number>(1000);
    const [results, setResults] = React.useState<RunnerResults | null>(null);

    const runnerRef = React.useRef<FilterChainRunner | null>(null);
    if (!runnerRef.current) {
        runnerRef.current = new FilterChainRunner();
    }
    const runner = runnerRef.current;

    useInterval(() => {
        if (!webcam) { return; }

        runner.filterChain = filterChain;
        setResults(runner.run({type: 'image', source: webcam.video!}));
    }, mspf);

    return <>
        {/* TODO: fix width/height nonsense */}
        <Webcam ref={setWebcam} videoConstraints={{width: 320, height: 240}}/>
        <div>
            mspf: <select value={mspf} onChange={(ev) => setMspf(+ev.target.value)} style={{fontSize: "200%"}}>
                {[1000, 500, 100, 50].map((mspf) =>
                    <option key={mspf} value={mspf}>{mspf}</option>
                )}
            </select>
        </div>
        {webcam &&
            <FilterChainEditorEmbed
                filterChain={filterChain} setFilterChain={setFilterChain}
                input={webcam.video!} results={results || undefined}
            />
        }
    </>;
}

export default DemoEmbedComponent;