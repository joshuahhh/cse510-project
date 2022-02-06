import React from 'react';
import { filterSpecByName, FilterUse, NumberParameterSpec } from '../model/filters';
import { ChromePicker } from 'react-color';

interface Props {
  filterUse: FilterUse,
  setFilterUse: (newFilterUse: FilterUse) => void,

  deleteMe: () => void,

  canvas: HTMLCanvasElement | undefined,
}

function Filter({filterUse, setFilterUse, deleteMe, canvas}: Props) {
  const [canvasContainer, setCanvasContainer] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (canvas && canvasContainer) {
      canvasContainer.appendChild(canvas);
    }
  }, [canvas, canvasContainer])

  const filterSpec = filterSpecByName(filterUse.specName);
  if (!filterSpec) {
    return <div className="Error">cannot find filter with key <pre>{filterUse.specName}</pre></div>;
  }

  return <div className="card filter">
    <div className="card-left">
      <h1>{filterSpec.name}</h1>
      {filterSpec.parameters.map((parameter) =>
        <div key={parameter.name}>
          <div style={{display: 'inline-block', width: 200, textAlign: 'right', marginRight: 10}}>{parameter.name}</div>
          {parameter.type === 'number'
            ? numberEditor(parameter, filterUse.parameterValues[parameter.name], (value) => {
                const newFilterUse = {...filterUse};
                newFilterUse.parameterValues[parameter.name] = value;
                setFilterUse(newFilterUse);
              })
            : parameter.type === 'color'
            ? colorEditor(filterUse.parameterValues[parameter.name], (value) => {
              const newFilterUse = {...filterUse};
              newFilterUse.parameterValues[parameter.name] = value;
              setFilterUse(newFilterUse);
            })
            : <span>[unknown parameter type {(parameter as any).type}]</span>
          }
        </div>
      )}
    </div>
    <div className="card-right">
      <div ref={setCanvasContainer}></div>
    </div>
    <div style={{position: 'absolute', right: 30}} onClick={deleteMe}>
      <button>❌</button>
    </div>
  </div>;
}

function numberEditor(parameter: NumberParameterSpec, value: any, setValue: (value: any) => void) {
  return <input
    type="range"
    min={parameter.min} max={parameter.max} step={parameter.step}
    value={value}
    onChange={(event) => setValue(+event.target.value)}
  />
}

function colorEditor(value: any, setValue: (value: any) => void) {
  return <ChromePicker color={{r: value[0] * 255, g: value[1] * 255, b: value[2] * 255}} onChange={(color) => setValue([color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255])} disableAlpha={true}/>
}

export default Filter;
