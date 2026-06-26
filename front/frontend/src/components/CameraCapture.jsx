import React, {
 useRef
} from "react";

import Webcam
 from "react-webcam";

export default function CameraCapture({
 onCapture
}) {

 const webcamRef =
  useRef(null);

 const capture = () => {

  const imageSrc =
   webcamRef.current
   .getScreenshot();

  onCapture(imageSrc);
 };

 return (

  <>
   <Webcam
    ref={webcamRef}
    screenshotFormat="image/jpeg"
   />

   <button
    onClick={capture}
   >
    Capture
   </button>
  </>
 );
}
