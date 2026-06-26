import * as faceapi from "face-api.js";

let loaded = false;

export async function loadFaceModels() {
  if (loaded) return;

  const MODEL_URL = "/models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  loaded = true;
}

export async function getFaceDescriptor(image) {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected.");
  }

  return Array.from(detection.descriptor);
}
