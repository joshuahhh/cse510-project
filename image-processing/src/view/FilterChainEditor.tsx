import React from 'react';
import { MdOutlineAddCircleOutline } from "react-icons/md";
import FilterEditor from './FilterEditor';
import { FilterSpec, filterSpecs, FilterUse, newFilterUse } from '../model/filters';
import { RunnerResults } from '../model/FilterChainRunner';
import FlipMove from 'react-flip-move';
import styles from './FilterChainEditor.css';
import reactColorfulStyles from './react-colorful.css'

export interface FilterChainEditorProps {
  filterChain: FilterUse[],
  setFilterChain: (newFilterChain: FilterUse[]) => void,

  input: HTMLVideoElement | HTMLCanvasElement;
  results: RunnerResults | undefined;

  isMirrored: boolean;
}

function FilterChainEditor({filterChain, setFilterChain, input, results, isMirrored}: FilterChainEditorProps) {
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
      <h1 className="filter-chain-editor-title">Image Processing Pipeline</h1>
      <div className="scroller">
        <FlipMove className="flipmove">
          {filterChain.map((filterUse, i) =>
            <FilterEditor
              key={filterUse.id}
              filterUse={filterUse}
              result={results?.intermediate[filterUse.id]}
              originalImage={input || undefined}
              isMirrored={isMirrored}
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
              <select value={addFilterSelection} onChange={(ev) => setAddFilterSelection(ev.target.value)}>
                {
                  // organize specs by input->output type
                  Object.entries(filterSpecs
                    .reduce((acc, filterSpec) => {
                      const key = `${filterSpec.inputType} → ${filterSpec.outputType}`;
                      acc[key] = [...(acc[key] || []), filterSpec];
                      return acc;
                    }, {} as any) as Record<string, FilterSpec[]>)
                    .map(([label, specs]) =>
                      <optgroup label={label} key={label}>
                        {
                          specs.map(filterSpec =>
                            <option key={filterSpec.name} value={filterSpec.name}>{filterSpec.name}</option>
                          )
                        }
                      </optgroup>
                    )
                }
              </select>
              <button className="button-add" onClick={() => setFilterChain([...filterChain, newFilterUse(addFilterSelection)])}><MdOutlineAddCircleOutline /> Add</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-left">
            <h2>Output</h2>
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

export default FilterChainEditor;
