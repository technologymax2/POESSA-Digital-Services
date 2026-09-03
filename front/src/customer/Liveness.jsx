import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Navbar from "../components/Sidebar";


const faceapi = window.faceapi;

const Liveness = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);

  const {
    pensioner,
    imageFile,
    capturedImage,
    faceDescriptor,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [instruction, setInstruction] = useState("Loading AI...");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  const steps = [
    "👈 Look Left",
    "👉 Look Right",
    "😊 Smile",
    "✅ Completed",
  ];

  useEffect(() => {
    if (!pensioner) {
      navigate("/verify");
    }
  }, [pensioner, navigate]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = process.env.REACT_APP_MODEL_URL || "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsLoaded(true);
        setInstruction(steps[0]);
      } catch (err) {
        console.error(err);
        alert("Unable to load AI models.");
      }
    };

    loadModels();
  }, []);

  const detectFace = async () => {
    if (!webcamRef.current) return null;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return null;

    const img = await faceapi.fetchImage(screenshot);

    return await faceapi
      .detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptor();
  };

  const euclideanDistance = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  };

  const finishVerification = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("pensionerId", pensioner.pensionerId);

      if (faceDescriptor) {
        formData.append(
          "faceDescriptor",
          JSON.stringify(Array.from(faceDescriptor))
        );
      }

      if (imageFile) {
        formData.append("selfie", imageFile);
      } else {
        const blob = await (await fetch(capturedImage)).blob();
        formData.append(
          "selfie",
          new File([blob], "selfie.jpg", {
            type: "image/jpeg",
          })
        );
      }

      const res = await verifyPensioner(formData);
      setResult(res.data.data);

      if (res.data.data.verified) {
        setCompleted(true);
        setInstruction("✅ Verification Successful");
      } else {
        alert("Verification failed.");
        navigate("/verify");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const checkLiveness = async () => {
    if (completed || loading || !faceDescriptor) return;

    const detection = await detectFace();
    if (!detection) return;

    const distance = euclideanDistance(
      Array.from(faceDescriptor),
      Array.from(detection.descriptor)
    );

    if (distance > 0.6) {
      alert("❌ This face does not match the selected pensioner.");
      navigate("/verify");
      return;
    }

    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();

    const leftX = leftEye[0].x;
    const rightX = rightEye[3].x;
    const noseX = nose[3].x;
    const center = (leftX + rightX) / 2;

    if (step === 0 && noseX > center + 10) {
      setStep(1);
      setInstruction(steps[1]);
    } else if (step === 1 && noseX < center - 10) {
      setStep(2);
      setInstruction(steps[2]);
    } else if (step === 2 && detection.expressions.happy > 0.8) {
      setStep(3);
      setInstruction(steps[3]);
      await finishVerification();
    }
  };

  useEffect(() => {
    if (!modelsLoaded || completed || loading) return;

    const interval = setInterval(() => {
      checkLiveness();
    }, 500);

    return () => clearInterval(interval);
  }, [modelsLoaded, step, completed, loading, faceDescriptor]);

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 font-sans">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-[#162447] mb-8">
            Liveness Detection
          </h2>

          {loading ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-[#162447]">⏳ Verifying Identity, Please wait...</h3>
            </div>
          ) : !completed ? (
            <>
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-green-700">
                  {instruction}
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${((step + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden border-[8px] border-[#162447] shadow-2xl">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-6 text-center text-gray-600 font-medium">
                {modelsLoaded ? "🟢 Camera Ready" : "⏳ Loading AI Models..."}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-7xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-700">
                Verification Successful
              </h2>
              <p className="text-gray-700 mt-2 text-lg">
                Pensioner identity has been verified successfully.
              </p>

              {result && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto text-left shadow-sm">
                  <p className="mb-2"><strong>Verified:</strong> {result.verified ? "✅ Yes" : "❌ No"}</p>
                  <p className="mb-2"><strong>Face Match:</strong> {result.faceMatched ? "✅ Yes" : "❌ No"}</p>
                  <p className="mb-2"><strong>Liveness:</strong> {result.livenessPassed ? "✅ Passed" : "❌ Failed"}</p>
                  <p><strong>Similarity:</strong> {(result.similarity * 100).toFixed(2)}%</p>
                </div>
              )}

              <button
                onClick={() => navigate("/verify")}
                className="mt-8 bg-[#162447] hover:bg-[#101b36] text-white font-semibold px-8 py-3 rounded-lg text-lg transition shadow cursor-pointer"
              >
                Verify Another Pensioner
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Liveness;
