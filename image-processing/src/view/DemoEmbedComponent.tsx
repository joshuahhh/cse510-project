import React from "react";
import { FilterUse, newFilterUse } from "../model/filters";
import Webcam from 'react-webcam';
import FilterChainEditorEmbed from "./FilterChainEditorEmbed";
import useInterval from "./useInterval";
import FilterChainRunner, { RunnerResults } from "../model/FilterChainRunner";
import useJsonLocalStorage from "./useJsonLocalStorage";

const defaultChain = [
    newFilterUse('Blur'),
    newFilterUse('Similar colors'),
    newFilterUse('Detect contours'),
    newFilterUse('Largest contour'),
    newFilterUse('Center of contour'),
];

function DemoEmbedComponent() {
    const [filterChain, setFilterChain] = useJsonLocalStorage<FilterUse[]>('demo-chain', defaultChain);

    const [deviceId, setDeviceId] = React.useState({});
    const [isMirrored, setIsMirrored] = React.useState(false);
    const [devices, setDevices] = React.useState([]);

    const handleDevices = React.useCallback(
        (mediaDevices) =>
            setDevices(mediaDevices.filter((device: MediaDeviceInfo) => device.kind === "videoinput")),
        [setDevices]
    );

    React.useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );

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
        setResults(runner.run({ type: 'image', source: webcam.video! }));
    }, mspf);

    return <>
        {/* TODO: fix width/height nonsense */}

        <div className="panel left-panel">
            <div className="video-settings">
                <h1>Video settings</h1>
                <label htmlFor="device">Video device input:</label>
                <select id="device" onChange={(ev) => setDeviceId(ev.target.value)}>
                    {devices.map((d: MediaDeviceInfo) =>
                        <option value={d.deviceId} key={d.deviceId}>{d.label}</option>
                    )}
                </select>
                <br />
                <label htmlFor="mirror">Mirror video:</label>
                <input id="mirror" type="checkbox" checked={isMirrored} onChange={(ev) => setIsMirrored(ev.target.checked)} />
                <br />
                <label htmlFor="mspf">Frames per second:</label>
                <select id="mspf" value={mspf} onChange={(ev) => setMspf(+ev.target.value)}>
                    {[1000, 500, 100, 50].map((mspf) =>
                        <option key={mspf} value={mspf}>{1000 / mspf} fps</option>
                    )}
                </select>
            </div>

            <Webcam ref={setWebcam} mirrored={isMirrored} videoConstraints={{
                width: 320,
                height: 240,
                deviceId: deviceId,
            }} />

            <br />
            <button onClick={() => setFilterChain(defaultChain)}>Reset filter chain</button>
        </div>

        <div className="panel right-panel">
            {webcam &&
                <FilterChainEditorEmbed
                    filterChain={filterChain} setFilterChain={setFilterChain}
                    input={webcam.video!} results={results || undefined}
                    isMirrored={isMirrored}
                />
            }
        </div>

    </>;
}

export default DemoEmbedComponent;