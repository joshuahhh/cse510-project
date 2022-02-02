import React, { ImgHTMLAttributes } from 'react';
import Webcam from 'react-webcam';
import cv from "@techstark/opencv-js";
import './App.css';

function App() {
  const webcamRef = React.useRef<Webcam>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);

  const capture = React.useCallback(() => {
    if (!webcamRef.current) { throw new Error("webcamRef empty"); }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) { throw new Error("no screenshot returned"); }
    setImgSrc(imageSrc);
    requestAnimationFrame(() => {
      if (!imgRef.current) { throw new Error("imgRef empty"); }
      (window as any).mat = cv.imread(imgRef.current);
    })
  }, [webcamRef, setImgSrc]);

  return (
    <div className="App">
      <Webcam ref={webcamRef}/>
      <button onClick={capture}>Capture photo</button>
      {imgSrc && (
        <img
          ref={imgRef}
          alt=""
          src={imgSrc}
        />
      )}
    </div>
  );
}

export default App;
