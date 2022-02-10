import React from 'react';
import { filterSpecByName, FilterUse, NumberParameterSpec, ChoiceParameterSpec } from '../model/filters';
import { RgbColorPicker } from 'react-colorful';
import { Result } from '../model/FilterChainRunner';
import DomNode from './DomNode';
import * as cv from '@techstark/opencv-js';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  filterUse: FilterUse,
  setFilterUse: (newFilterUse: FilterUse) => void,

  deleteMe: () => void,
  raiseMe: (() => void) | undefined,
  lowerMe: (() => void) | undefined,

  result: Result | undefined,

  originalImage: HTMLVideoElement | HTMLCanvasElement | undefined;
}

function dims(source: HTMLVideoElement | HTMLCanvasElement) {
  if (source instanceof HTMLVideoElement) {
    return [source.videoWidth, source.videoHeight];
  } else {
    return [source.width, source.height];
  }
}

const FilterEditor = React.forwardRef(({filterUse, setFilterUse, deleteMe, raiseMe, lowerMe, result, originalImage}: Props, ref: React.ForwardedRef<HTMLDivElement>) => {
  // console.log(filterUse.id, "render", canvas);

  const filterSpec = filterSpecByName(filterUse.specName);
  if (!filterSpec) {
    return <div className="Error">cannot find filter with key <pre>{filterUse.specName}</pre></div>;
  }

  return <div className="card filter" ref={ref}>
    <ErrorBoundary>
      <div className="card-left">
        <div className="card-left-top">
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
        </div>
        <div className="card-left-bottom">
          <div style={{fontSize: "50%", marginTop: 15}}>{filterUse.id}</div>
        </div>
      </div>
      <div className="card-right">
        {result?.type === 'image' &&
          <>
            <DomNode node={result.source}/>
            <div className="output-desc">
              an image
            </div>
            </>
        }
        {result?.type === 'contours' &&
          <>
            {originalImage && dims(originalImage)[0] > 0 &&
              <DomNode node={(() => {
                const canvas = document.createElement('canvas');
                [canvas.width, canvas.height] = dims(originalImage);
                const ctx = canvas.getContext("2d")!;
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
            <div className="output-desc">
              {result.contours.size()} contour(s)
            </div>
          </>
        }
        {result?.type === 'contour' &&
          <>
            {originalImage && dims(originalImage)[0] > 0 &&
              <DomNode node={(() => {
                const canvas = document.createElement('canvas');
                [canvas.width, canvas.height] = dims(originalImage);
                const ctx = canvas.getContext("2d")!;
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
            <div className="output-desc">
              a contour
            </div>
          </>
        }
        {result?.type === 'point' &&
          <>
            {originalImage && dims(originalImage)[0] > 0 &&
              <DomNode node={(() => {
                const canvas = document.createElement('canvas');
                [canvas.width, canvas.height] = dims(originalImage);
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(originalImage, 0, 0);
                ctx.beginPath();
                ctx.arc(result.point.x, result.point.y, 10, 0*Math.PI, 2*Math.PI);
                ctx.fillStyle = 'rgb(0, 255, 0)';
                ctx.fill();
                ctx.strokeStyle = 'rgb(0, 0, 0)';
                ctx.stroke();
                return canvas;
              })()}/>
            }
            <div className="output-desc">
              a point: ({result.point.x.toFixed(3)}, {result.point.y.toFixed(3)})
            </div>
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
      <div className="card-controls">
        {<button onClick={raiseMe} style={{visibility: raiseMe ? 'visible' : 'hidden'}}>⇧</button>}
        {<button onClick={lowerMe} style={{visibility: lowerMe ? 'visible' : 'hidden'}}>⇩</button>}
        <button onClick={deleteMe}>❌</button>
      </div>
    </ErrorBoundary>
  </div>;
})

function numberEditor(parameter: NumberParameterSpec, value: any, setValue: (value: any) => void) {
  return <input
    type="range"
    min={parameter.min} max={parameter.max} step={parameter.step}
    value={value}
    onChange={(event) => setValue(+event.target.value)}
  />
}

function colorEditor(value: any, setValue: (value: any) => void) {
  return <RgbColorPicker color={{r: value[0] * 255, g: value[1] * 255, b: value[2] * 255}} onChange={(color) => setValue([color.r / 255, color.g / 255, color.b / 255])} />
}

function choiceEditor(parameter: ChoiceParameterSpec, value: any, setValue: (value: any) => void) {
  return <select value={value} onChange={(ev) => setValue(ev.target.value)}>
    {parameter.choices.map((choice) =>
      <option key={choice} value={choice}>{choice}</option>
    )}
  </select>
}

export default FilterEditor;