import React from 'react';
import FilterEditor from './FilterEditor';
import { filterSpecs, FilterUse, newFilterUse } from '../model/filters';
import { RunnerResults } from '../model/FilterChainRunner';
import FlipMove from 'react-flip-move';
import styles from './FilterChainEditor.css';
import reactColorfulStyles from './react-colorful.css'

export interface FilterChainEditorProps {
  filterChain: FilterUse[],
  setFilterChain: (newFilterChain: FilterUse[]) => void,

  input: HTMLVideoElement | HTMLCanvasElement;
  results: RunnerResults | undefined;
}

function FilterChainEditor({filterChain, setFilterChain, input, results}: FilterChainEditorProps) {
  const [addFilterSelection, setAddFilterSelection] = React.useState<string>(filterSpecs[0].name)

  return (
    <div className="FilterChainEditor">
      <style type="text/css">{styles}</style>
      <style type="text/css">{reactColorfulStyles}</style>
      {/* <div className="card">
        <div className="card-left">
          <h1>Input</h1>
        </div>
      </div> */}
      <div className="scroller">
        <FlipMove>
          {filterChain.map((filterUse, i) =>
            <FilterEditor
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
              raiseMe={i > 0 ? () => {
                const newFilterChain = [
                  ...filterChain.slice(0, i - 1),
                  filterChain[i], filterChain[i - 1],
                  ...filterChain.slice(i + 1)
                ];
                setFilterChain(newFilterChain);
              } : undefined}
              lowerMe={i < filterChain.length - 1 ? () => {
                const newFilterChain = [
                  ...filterChain.slice(0, i),
                  filterChain[i + 1], filterChain[i],
                  ...filterChain.slice(i + 2)
                ];
                setFilterChain(newFilterChain);
              } : undefined}
            />
          )}
        </FlipMove>
        <div className="card filter">
          <div className="card-left">
            <div className="card-left-top">
              {/* TODO: Organize filters by type (image -> image, etc) */}
              <select value={addFilterSelection} onChange={(ev) => setAddFilterSelection(ev.target.value)} style={{fontSize: "200%"}}>
                {filterSpecs.map((filterSpec) =>
                  <option key={filterSpec.name} value={filterSpec.name}>{filterSpec.name}</option>
                )}
              </select>
              <button onClick={() => setFilterChain([...filterChain, newFilterUse(addFilterSelection)])} style={{fontSize: "200%"}}>Add</button>
            </div>
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
