import React, { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {

  const [message, setMessage] = useState("Comparing Faces...");

  useEffect(() => {

    verifyFace();

  }, []);

  const verifyFace = async () => {

    try {

      const MODEL_URL =
        "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const idImg = await faceapi.fetchImage(idPhoto);
      const selfieImg = await faceapi.fetchImage(selfiePhoto);

      const idDescriptor = await faceapi
        .detectSingleFace(idImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const selfieDescriptor = await faceapi
        .detectSingleFace(selfieImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idDescriptor || !selfieDescriptor) {

        setMessage("Face not detected");
        return;

      }

      const distance = faceapi.euclideanDistance(
        idDescriptor.descriptor,
        selfieDescriptor.descriptor
      );

      if (distance < 0.5) {

        setMessage("Face Matched Successfully ✅");

        setTimeout(() => {

          onSuccess();

        }, 1500);

      } else {

        setMessage("Face Match Failed ❌");

      }

    } catch (err) {

      console.log(err);

      setMessage("Error while matching");

    }

  };

  return (
    <div style={{ textAlign: "center" }}>

      <h2>{message}</h2>

    </div>
  );
}

export default FaceMatch;
