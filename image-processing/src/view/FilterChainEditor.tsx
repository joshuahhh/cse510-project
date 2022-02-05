import React from 'react';
import Webcam from 'react-webcam';
import Filter from './Filter';
import { filterSpecByName, filterSpecs, FilterUse, newFilterUse } from '../model/filters';
import useInterval from './useInterval';
import * as cv from '@techstark/opencv-js';
import FilterChainRunner from '../model/FilterChainRunner';

function FilterChainEditor() {
  // TODO: this should prob be external lol
  const [filterChain, setFilterChain] = React.useState<FilterUse[]>([
    newFilterUse('Blur'),
    newFilterUse('Similar colors'),
  ])

  // TODO: hack
  const [forceCount, setForceCount] = React.useState(0);
  function forceRedraw() {
    setForceCount(forceCount + 1);
  }

  const runnerRef = React.useRef<FilterChainRunner | null>(null);
  if (!runnerRef.current) {
    runnerRef.current = new FilterChainRunner();
  }
  const runner = runnerRef.current;

  const [addFilterSelection, setAddFilterSelection] = React.useState<string>(filterSpecs[0].name)

  const webcamRef = React.useRef<Webcam>(null);

  useInterval(() => {
    if (!webcamRef.current?.video) { return; }

    runner.filterChain = filterChain;
    const lastInput = runner.run(webcamRef.current.video);

    // TODO: what if it's a video; must draw from video (still context.drawImage(video, 0, 0, width, height);)

    const gl = (lastInput as any).getContext("webgl");
    const canvas2d = document.createElement('canvas');
    canvas2d.width = lastInput.width;
    canvas2d.height = lastInput.height;
    const ctx = canvas2d.getContext("2d")!;

    // TODO: delay this?
    // TODO: reuse resources?

    // copy the webgl canvas to the 2d canvas
    ctx.drawImage(gl.canvas, 0, 0);

    let src = cv.imread(canvas2d);
    console.log(src.cols, src.rows);
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // You can try more different parameters
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // draw contours with random Scalar
    console.log('size', contours.size());
    for (let i = 0; i < (contours.size() as any as number); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                  Math.round(Math.random() * 255));
        cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    cv.imshow('canvasOutput', dst);
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

    forceRedraw(); // TODO: usually this isn't necessary, and wastes 3 ms / frame
  }, 30);

  return (
    <div className="App">
      <div className="card">
        <div className="card-left">
          <h1>Input</h1>
        </div>
        <div className="card-right">
          {/* TODO: fix width/height nonsense */}
          <Webcam width={300} height={225} ref={webcamRef}/>
        </div>
      </div>
      <div className="scroller">
        {filterChain.map((filterUse, i) =>
          <Filter
            key={filterUse.id}
            filterUse={filterUse}
            canvas={runner.getGlfxResources(filterUse.id)?.canvas}
            setFilterUse={(newFilterUse) => {
              const newFilterChain = filterChain.slice();
              newFilterChain[i] = newFilterUse;
              setFilterChain(newFilterChain);
            }}
            deleteMe={() => {
              const newFilterChain = filterChain.slice();
              newFilterChain.splice(i, 1);
              setFilterChain(newFilterChain);
            }}
          />
        )}
        <div className="card filter">
          <div className="card-left">
            <select value={addFilterSelection} onChange={(ev) => setAddFilterSelection(ev.target.value)} style={{fontSize: "200%"}}>
              {filterSpecs.map((filterSpec) =>
                <option key={filterSpec.name} value={filterSpec.name}>{filterSpec.name}</option>
              )}
            </select>
            <button onClick={() => setFilterChain((filterChain) => [...filterChain, newFilterUse(addFilterSelection)])} style={{fontSize: "200%"}}>Add</button>
          </div>
        </div>
        <div className="card">
          <div className="card-left">
            <h1>Output</h1>
          </div>
          <div className="card-right">
            <span style={{fontSize: "400%"}}>↑</span>
            <canvas id="canvasOutput"/>
            (see above)
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterChainEditor;
