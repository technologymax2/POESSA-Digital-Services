// src/utils/faceApi.js

import * as faceapi from "face-api.js";

export const loadModels = async () => {

  const MODEL_URL = "/models";

  await faceapi.nets.tinyFaceDetector.loadFromUri(
    MODEL_URL
  );

  await faceapi.nets.faceLandmark68Net.loadFromUri(
    MODEL_URL
  );

  await faceapi.nets.faceRecognitionNet.loadFromUri(
    MODEL_URL
  );
};

export const getFaceDescriptor =
async (imageElement) => {

  const detection =
   await faceapi
   .detectSingleFace(
      imageElement,
      new faceapi.TinyFaceDetectorOptions()
   )
   .withFaceLandmarks()
   .withFaceDescriptor();

  if(!detection){
    throw new Error(
      "Face not detected"
    );
  }

  return Array.from(
    detection.descriptor
  );
};
