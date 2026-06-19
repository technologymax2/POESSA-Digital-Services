import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";

function LivenessTest({ faydaNumber, idPhoto }) {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const stageRef = useRef(0);

  const [task, setTask] = useState("ሞዴሎች በመጫን ላይ...");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    loadModels();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const loadModels = async () => {
    try {
      const MODEL_URL =
        "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      startVideo();
    } catch (err) {
      setTask("Model መጫን አልተሳካም");
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      videoRef.current.srcObject = stream;

      setTask("ፈገግ ይበሉ 😊");

      startLiveness();
    } catch (err) {
      setTask("ካሜራ አልተገኘም");
    }
  };

  const verifySuccess = async () => {
    try {
      await fetch(
        "https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faydaNumber,
            status: "Verified",
          }),
        }
      );

      setTask("ማረጋገጫው ተሳክቷል ✅");

      clearInterval(intervalRef.current);
    } catch (err) {
      console.log(err);
    }
  };

  const startLiveness = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) return;

      const { expressions, landmarks } = detection;

      const nose = landmarks.getNose()[0];

      // Smile
      if (stageRef.current === 0 && expressions.happy > 0.7) {
        setStage(1);
        setTask("ጭንቅላትዎን ወደ ላይና ታች ያንቀሳቅሱ");
      }

      // Nod
      else if (stageRef.current === 1 && Math.abs(nose.y - 150) > 30) {
        setStage(2);
        setTask("ወደ ግራና ቀኝ ያዙሩ");
      }

      // Turn
      else if (stageRef.current === 2 && Math.abs(nose.x - 200) > 40) {
        setStage(3);
        verifySuccess();
      }
    }, 1000);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>{task}</h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "400px",
          borderRadius: "15px",
          border: "3px solid #0077ff",
        }}
      />
    </div>
  );
}

export default LivenessTest;
