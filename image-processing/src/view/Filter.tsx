import React from 'react';
import { filterSpecByName, FilterUse, NumberParameterSpec, ChoiceParameterSpec } from '../model/filters';
import { ChromePicker } from 'react-color';
import { Result } from '../model/FilterChainRunner';
import DomNode from './DomNode';
import * as cv from '@techstark/opencv-js';

interface Props {
  filterUse: FilterUse,
  setFilterUse: (newFilterUse: FilterUse) => void,

  deleteMe: () => void,

  result: Result | undefined,

  originalImage: HTMLVideoElement | undefined;
}

function Filter({filterUse, setFilterUse, deleteMe, result, originalImage}: Props) {
  // console.log(filterUse.id, "render", canvas);

  const filterSpec = filterSpecByName(filterUse.specName);
  if (!filterSpec) {
    return <div className="Error">cannot find filter with key <pre>{filterUse.specName}</pre></div>;
  }

  return <div className="card filter">
    <div className="card-left">
      <h1>{filterSpec.name}</h1>
      {filterSpec.parameters.map((parameter) =>
        <div key={parameter.name}>
          <div>{parameter.name}</div>
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
            : parameter.type === 'choice'
            ? choiceEditor(parameter, filterUse.parameterValues[parameter.name], (value) => {
              const newFilterUse = {...filterUse};
              newFilterUse.parameterValues[parameter.name] = value;
              setFilterUse(newFilterUse);
            })
            : <span>[unknown parameter type {(parameter as any).type}]</span>
          }
        </div>
      )}
      {/* TODO: put this at bottom or remove it */}
      <div style={{fontSize: "50%", marginTop: 15}}>{filterUse.id}</div>
    </div>
    <div className="card-right">
      {result?.type === 'image' &&
        <DomNode node={result.source}/>
      }
      {result?.type === 'contours' &&
        <>
          {result.contours.size()} contour(s)
          {originalImage &&
            <DomNode node={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = originalImage.width;
              canvas.height = originalImage.height;
              const ctx = canvas.getContext("2d")!;
              ctx.scale(0.5,0.5) // todo oh no
              ctx.drawImage(originalImage, 0, 0);
              let dst = cv.imread(canvas);
              for (let i = 0; i < (result.contours.size() as any as number); i++) {
                  let color = new cv.Scalar(0, 255, 0, 255);
                  cv.drawContours(dst, result.contours, i, color, 3, cv.LINE_8, result.hierarchy, 100);
              }
              cv.imshow(canvas, dst);
              dst.delete();
              return canvas;
            })()}/>
          }
        </>
      }
      {result?.type === 'contour' &&
        <>
          a contour
          {originalImage &&
            <DomNode node={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = originalImage.width;
              canvas.height = originalImage.height;
              const ctx = canvas.getContext("2d")!;
              ctx.scale(0.5,0.5) // todo oh no
              ctx.drawImage(originalImage, 0, 0);
              let dst = cv.imread(canvas);
              let color = new cv.Scalar(0, 255, 0, 255);
              let matVec = new cv.MatVector();
              matVec.push_back(result.contour);
              cv.drawContours(dst, matVec, 0, color, 3, cv.LINE_8);
              cv.imshow(canvas, dst);
              dst.delete();
              matVec.delete();
              return canvas;
            })()}/>
          }
        </>
      }
      {result?.type === 'point' &&
        <>
          a point: ({result.point.x.toFixed(3)}, {result.point.y.toFixed(3)})
          {originalImage &&
            <DomNode node={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = originalImage.width;
              canvas.height = originalImage.height;
              const ctx = canvas.getContext("2d")!;
              ctx.scale(0.5,0.5) // todo oh no
              ctx.drawImage(originalImage, 0, 0);
              ctx.fillStyle = 'rgb(0, 255, 0)'
              ctx.arc(2 * result.point.x, 2 * result.point.y, 10, 0*Math.PI, 2*Math.PI); // todo oh no
              ctx.fill();
              return canvas;
            })()}/>
          }
        </>
      }
      {result?.type === 'raw' &&
        <pre>
          {JSON.stringify(result.data, undefined, 2)}
        </pre>
      }
      {result?.type === 'error' &&
        <div style={{color: 'red'}}>
          {result.message}
        </div>
      }
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

function choiceEditor(parameter: ChoiceParameterSpec, value: any, setValue: (value: any) => void) {
  return <select value={value} onChange={(ev) => setValue(ev.target.value)}>
    {parameter.choices.map((choice) =>
      <option key={choice} value={choice}>{choice}</option>
    )}
  </select>
}

export default Filter;
