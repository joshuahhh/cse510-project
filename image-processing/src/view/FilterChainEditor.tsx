import React from 'react';
import Filter from './Filter';
import { filterSpecs, FilterUse, newFilterUse } from '../model/filters';
import { RunnerResults } from '../model/FilterChainRunner';

export interface FilterChainEditorProps {
  filterChain: FilterUse[],
  setFilterChain: (newFilterChain: FilterUse[]) => void,

  input: HTMLVideoElement | HTMLCanvasElement;
  results: RunnerResults | undefined;
}

function FilterChainEditor({filterChain, setFilterChain, input, results}: FilterChainEditorProps) {
  const [addFilterSelection, setAddFilterSelection] = React.useState<string>(filterSpecs[0].name)

  return (
    <div className="App">
      <div className="card">
        <div className="card-left">
          <h1>Input</h1>
        </div>
      </div>
      <div className="scroller">
        {filterChain.map((filterUse, i) =>
          <Filter
            key={filterUse.id}
            filterUse={filterUse}
            result={results?.intermediate[filterUse.id]}
            originalImage={input || undefined}
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
            <button onClick={() => setFilterChain([...filterChain, newFilterUse(addFilterSelection)])} style={{fontSize: "200%"}}>Add</button>
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
