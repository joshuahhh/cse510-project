import React from 'react';
import Webcam from 'react-webcam';
// import cv from "@techstark/opencv-js";
// import photon from "@silvia-odwyer/photon";
// import Image from "image-js";
import './App.css';

import * as glfx from '../glfx/lib'


function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef(callback)

  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  React.useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (!delay && delay !== 0) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(id)
  }, [delay])
}

function App() {
  const webcamRef = React.useRef<Webcam>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const dstImgRef = React.useRef<HTMLImageElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const [slider, setSlider] = React.useState(5);

  const handleDiv = React.useCallback((node) => {
    setNode(node);
  }, [])


  const canvasRef = React.useRef<any>();
  if (!canvasRef.current) {
    canvasRef.current = glfx.canvas();
  }

  const textureRef = React.useRef<any>(null);
  React.useEffect(() => {
    node?.appendChild(canvasRef.current);
  }, [node])

  // const capture = React.useCallback(async () => {
  //   if (!webcamRef.current) { throw new Error("webcamRef empty"); }
  //   const imageSrc = webcamRef.current.getScreenshot();
  //   if (!imageSrc) { throw new Error("no screenshot returned"); }
  //   setImgSrc(imageSrc);
  //   if (!imgRef.current) { throw new Error("imgRef empty"); }
  //   let image = await Image.load(imageSrc);
  //   let grey = image.grey();
  //   dstImgRef.current!.src = grey.toDataURL();
  // }, [webcamRef, setImgSrc]);

  // useInterval(async () => {
  //   if (!webcamRef.current) { throw new Error("webcamRef empty"); }
  //   // const imageSrc = webcamRef.current.getScreenshot();
  //   // if (!imageSrc) { throw new Error("no screenshot returned"); }
  //   // if (!divRef.current) { throw new Error("divRef empty"); }
  //   let tex = canvas

  //   // setImgSrc(imageSrc);
  //   // if (!imgRef.current) { throw new Error("imgRef empty"); }
  //   // let image = await Image.load(imageSrc);
  //   // let grey = image.grey();
  //   // dstImgRef.current!.src = grey.toDataURL();

  // }, 200);

  const capture = () => {
    if (!webcamRef.current) { throw new Error("no webcam"); }
    if (!textureRef.current) {
      textureRef.current = canvasRef.current.texture(webcamRef.current.video);
    } else {
      textureRef.current.loadContentsOf(webcamRef.current.video);
    }
    // console.log(slider)
    // canvasRef.current.draw(textureRef.current).triangleBlur(slider).update();
    canvasRef.current.draw(textureRef.current).similar([0,0,0], slider / 30).update();
    // try {
    //   canvasRef.current.draw(textureRef.current).triangleBlur(slider).update();
    // } catch {
    //   console.error("recreating texture?")
    //   textureRef.current.destroy();
    //   textureRef.current = null;
    // }
  };

  useInterval(capture, 30);

  return (
    <div className="App">
      <Webcam ref={webcamRef}/>
      <button onClick={capture}>Capture photo</button>
      <input
        type="range"
        min="0" max="30"
        value={slider}
        onChange={(event) => setSlider(+event.target.value)}
        step="1"/>
      <img
        ref={imgRef}
        alt=""
        src={imgSrc || ""}
      />
      <img
        ref={dstImgRef}
        alt=""
      />
      <div ref={handleDiv} />
    </div>
  );
}

export default App;
