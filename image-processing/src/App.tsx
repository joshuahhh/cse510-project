import React from 'react';
import Webcam from 'react-webcam';
import Filter from './Filter';
import { filterSpecByName, filterSpecs, FilterUse, newFilterUse } from './filters';
import useInterval from './useInterval';


function App() {
  const [filterChain, setFilterChain] = React.useState<FilterUse[]>([
    newFilterUse('Blur'),
    newFilterUse('Similar colors'),
  ])

  const [addFilterSelection, setAddFilterSelection] = React.useState<string>(filterSpecs[0].name)

  const webcamRef = React.useRef<Webcam>(null);

  const [canvases, setCanvases] = React.useState<any>({});
  const texturesRef = React.useRef<any>({});

  useInterval(() => {
    if (!webcamRef.current?.video) { return; }

    let lastInput: HTMLVideoElement | HTMLCanvasElement = webcamRef.current.video;
    for (const filterUse of filterChain) {
      const canvas = canvases[filterUse.id];
      // console.log(filterUse.id, canvas);
      if (!canvas) {
        break;
      }

      if (!texturesRef.current[filterUse.id]) {
        texturesRef.current = canvas.texture(lastInput);
      } else {
        texturesRef.current.loadTextureFrom(lastInput);
      }
      const filterSpec = filterSpecByName(filterUse.specName);
      if (!filterSpec) { throw new Error("oh no"); }
      const parameterValues = {...filterUse.parameterValues};
      for (const parameter of filterSpec.parameters) {
        if (!(parameter.name in parameterValues)) {
          parameterValues[parameter.name] = parameter.default;
        }
      }
      const input = canvas.draw(texturesRef.current);
      const operation = filterSpec.operation;
      const output = operation(input, parameterValues);
      output.update();
      lastInput = canvas;
    };
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
            setFilterUse={(newFilterUse) => {
              const newFilterChain = filterChain.slice();
              newFilterChain[i] = newFilterUse;
              setFilterChain(newFilterChain);
            }}
            setCanvas={(canvas) => {
              setCanvases((canvases: any) => ({...canvases, [filterUse.id]: canvas}));
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
            (see above)
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
