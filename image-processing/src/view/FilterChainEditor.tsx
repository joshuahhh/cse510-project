import React from 'react';
import Webcam from 'react-webcam';
import Filter from './Filter';
import { filterSpecs, FilterUse, newFilterUse } from '../model/filters';
import useInterval from './useInterval';
import FilterChainRunner, { RunnerResults } from '../model/FilterChainRunner';

function FilterChainEditor() {
  // TODO: this should prob be external lol
  const [filterChain, setFilterChain] = React.useState<FilterUse[]>([
    newFilterUse('Blur'),
    newFilterUse('Similar colors'),
    newFilterUse('Detect contours'),
    newFilterUse('Largest contour'),
    newFilterUse('Center of contour'),
  ])

  const [results, setResults] = React.useState<RunnerResults | null>(null);

  const [mspf, setMspf] = React.useState<number>(1000);

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
    setResults(runner.run({type: 'image', source: webcamRef.current.video}));
  }, mspf);
  // }, 30);

  return (
    <div className="App">
      <div className="card">
        <div className="card-left">
          <h1>Input</h1>
          <div>mspf:
            <select value={mspf} onChange={(ev) => setMspf(+ev.target.value)} style={{fontSize: "200%"}}>
              {[1000, 500, 100, 50].map((mspf) =>
                <option key={mspf} value={mspf}>{mspf}</option>
              )}
            </select>
          </div>
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
            result={results?.intermediate[filterUse.id]}
            originalImage={webcamRef.current?.video || undefined}
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
            {/* TODO: Organize filters by type (image -> image, etc) */}
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
