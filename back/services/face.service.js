// services/face.service.js

const faceapi = require("@vladmandic/face-api");
const canvas = require("canvas");
const path = require("path");

const {
  Canvas,
  Image,
  ImageData,
} = canvas;

faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
});

let loaded = false;

async function loadModels() {
  if (loaded) return;

  const modelPath = path.join(
    __dirname,
    "../models-face"
  );

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(
    modelPath
  );

  await faceapi.nets.faceLandmark68Net.loadFromDisk(
    modelPath
  );

  await faceapi.nets.faceRecognitionNet.loadFromDisk(
    modelPath
  );

  loaded = true;
}

async function getDescriptor(imageUrl) {
  await loadModels();

  const img =
    await canvas.loadImage(imageUrl);

  const detection =
    await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

  if (!detection) {
    throw new Error("Face not detected");
  }

  return Array.from(
    detection.descriptor
  );
}

function compareDescriptors(
  descriptor1,
  descriptor2
) {
  const distance =
    faceapi.euclideanDistance(
      descriptor1,
      descriptor2
    );

  const similarity =
    Math.round(
      Math.max(
        0,
        (1 - distance) * 100
      )
    );

  return {
    similarity,
    verified: similarity >= 85,
  };
}

module.exports = {
  getDescriptor,
  compareDescriptors,
};
