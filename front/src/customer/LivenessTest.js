import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

function LivenessTest({ onSuccess }) {

  const videoRef = useRef();

  const [task, setTask] = useState("Loading camera...");
  const [stage, setStage] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    runDetection();
  }, 1000);

  return () => clearInterval(interval);
}, [stage]);;

  const loadModels = async () => {

    const MODEL_URL =
      "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    startVideo();

  };

  const startVideo = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    videoRef.current.srcObject = stream;

    setTask("😊 Smile");

  };

  const runDetection = async () => {

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detection) return;

    const nose = detection.landmarks.getNose()[0];

    if (
      stage === 0 &&
      detection.expressions.happy > 0.7
    ) {

      setStage(1);
      setTask("⬆️⬇️ Move head up and down");

    }

    else if (
      stage === 1 &&
      Math.abs(nose.y - 150) > 30
    ) {

      setStage(2);
      setTask("⬅️➡️ Turn left and right");

    }

    else if (
      stage === 2 &&
      Math.abs(nose.x - 200) > 40
    ) {

      setStage(3);

      setTask("Verification Successful ✅");

      setTimeout(() => {

        onSuccess();

      }, 2000);

    }

  };

  return (

    <div style={{ textAlign: "center" }}>

      <h2>{task}</h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        width="450"
        onPlay={() => {

          setInterval(runDetection, 1000);

        }}
      />

    </div>

  );
}

export default LivenessTest;
