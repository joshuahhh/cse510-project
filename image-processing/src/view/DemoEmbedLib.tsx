import React from "react";
import Webcam from 'react-webcam';
import useInterval from "./useInterval";
import { imageProcessingTool } from "./lib";

function DemoEmbedLib() {
    const [webcam, setWebcam] = React.useState<Webcam | null>(null);
    const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
    const [mspf, setMspf] = React.useState<number>(1000);
    const [output, setOutput] = React.useState<any>(null);

    useInterval(() => {
        if (!webcam) { return; }

        const output = imageProcessingTool({
            input: webcam.video!,
            showTool: true,
        })!;

        setOutput(output);

        if (output.type === 'point' && canvas) {
            var context = canvas.getContext('2d')!;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.arc(output.point.x, output.point.y, 10, 0*Math.PI, 2*Math.PI);
            context.fillStyle = 'rgb(0, 255, 0)';
            context.fill();
            context.strokeStyle = 'rgb(0, 0, 0)';
            context.stroke();
        }
    }, mspf);

    return <>
        {/* TODO: fix width/height nonsense */}
        <div style={{position: 'relative'}}>
            <Webcam width={300} height={225} ref={setWebcam}/>
            <canvas width={300} height={225} ref={setCanvas} style={{position: 'absolute', left: 0, top: 0}}/>
        </div>
        <select value={mspf} onChange={(ev) => setMspf(+ev.target.value)} style={{fontSize: "200%"}}>
            {[1000, 500, 100, 50].map((mspf) =>
                <option key={mspf} value={mspf}>{mspf}</option>
            )}
        </select>
        <pre>
            {JSON.stringify(output)}
        </pre>
    </>;
}

export default DemoEmbedLib;