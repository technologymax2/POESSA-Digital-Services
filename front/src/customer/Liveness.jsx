import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import Webcam from "react-webcam";
import Navbar from "../components/Sidebar";

import * as faceapi from "face-api.js";

const API_BASE_URL =
  "https://poessa-digital-services-1.onrender.com";

const Liveness = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const webcamRef = useRef(null);

  const {
    pensioner,
    faydaNumber,
    frontIdUrl,
    backIdUrl,
    imageMethod,
    imageFile: incomingImageFile,
    capturedImage: incomingCapturedImage,
  } = location.state || {};

  const [modelsLoaded, setModelsLoaded] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [instruction, setInstruction] =
    useState("Loading AI...");

  const [step, setStep] = useState(0);

  const [result, setResult] =
    useState(null);

  const [selfieImage, setSelfieImage] =
    useState(null);

  const [livenessFlags, setLivenessFlags] =
    useState({
      smilePassed: false,
      nodPassed: false,
      turnPassed: false,
    });

  const steps = [
    "👈 Look Left",
    "👉 Look Right",
    "😊 Smile",
    "📸 Capturing Selfie",
    "🔍 Face Match",
    "✅ Completed",
  ];

  /*
   * =========================
   * REDIRECT IF NO PENSIONER
   * =========================
   */
  useEffect(() => {
    if (!pensioner) {
      navigate("/verify", {
        replace: true,
      });
    }
  }, [pensioner, navigate]);

  /*
   * =========================
   * LOAD MODELS
   * =========================
   */
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const MODEL_URL =
          process.env.REACT_APP_MODEL_URL ||
          "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(
            MODEL_URL
          ),

          faceapi.nets.faceLandmark68Net.loadFromUri(
            MODEL_URL
          ),

          faceapi.nets.faceExpressionNet.loadFromUri(
            MODEL_URL
          ),
        ]);

        if (mounted) {
          setModelsLoaded(true);
          setInstruction(steps[0]);
        }
      } catch (err) {
        console.error(
          "AI Model Loading Error:",
          err
        );

        alert(
          "Unable to load AI models. Please check /public/models."
        );
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =========================
   * DETECT FACE
   * =========================
   */
  const detectFace = async () => {
    if (!webcamRef.current) {
      return null;
    }

    const screenshot =
      webcamRef.current.getScreenshot();

    if (!screenshot) {
      return null;
    }

    const img =
      await faceapi.fetchImage(
        screenshot
      );

    return await faceapi
      .detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.35,
        })
      )
      .withFaceLandmarks()
      .withFaceExpressions();
  };

  /*
   * =========================
   * CAPTURE SELFIE
   * =========================
   */
  const captureSelfie = () => {
    if (!webcamRef.current) {
      return null;
    }

    const screenshot =
      webcamRef.current.getScreenshot();

    if (!screenshot) {
      return null;
    }

    setSelfieImage(screenshot);

    return screenshot;
  };

  /*
   * =========================
   * FINISH VERIFICATION
   * =========================
   */
  const finishVerification = async (
    selfieBase64
  ) => {
    try {
      setLoading(true);
      setInstruction("🔍 Face Match እየተደረገ ነው...");

      if (!pensioner) {
        throw new Error(
          "Pensioner information is missing."
        );
      }

      if (!faydaNumber) {
        throw new Error(
          "Fayda number is missing."
        );
      }

      if (!selfieBase64) {
        throw new Error(
          "Selfie image is missing."
        );
      }

      /*
       * Convert selfie to Blob
       */
      const response = await fetch(
        selfieBase64
      );

      const blob =
        await response.blob();

      /*
       * =========================
       * SEND JSON TO BACKEND
       * =========================
       *
       * Backend will:
       * - Find pensioner by Fayda
       * - Get pensioner.photoUrl
       * - Compare DB photo with selfie
       * - Calculate match %
       */
      const apiResponse = await fetch(
        `${API_BASE_URL}/api/liveness/verify-success`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            faydaNumber,

            selfiePhotoUrl:
              selfieBase64,

            smilePassed:
              livenessFlags.smilePassed,

            nodPassed:
              livenessFlags.nodPassed,

            turnPassed:
              livenessFlags.turnPassed,
          }),
        }
      );

      const data =
        await apiResponse.json();

      if (!apiResponse.ok || !data.success) {
        throw new Error(
          data.message ||
            "Verification failed."
        );
      }

      setResult(data.data);

      if (data.data?.verificationStatus === "Verified") {
        setCompleted(true);
        setInstruction(
          "✅ Verification Successful"
        );
      } else {
        setCompleted(true);
        setInstruction(
          "❌ Verification Failed"
        );
      }
    } catch (err) {
      console.error(
        "Verification Error:",
        err
      );

      alert(
        err.message ||
          "Verification failed."
      );

      navigate("/verify");
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================
   * LIVENESS CHECK
   * =========================
   */
  const checkLiveness = async () => {
    if (
      completed ||
      loading ||
      !modelsLoaded
    ) {
      return;
    }

    const detection =
      await detectFace();

    if (!detection) {
      return;
    }

    const landmarks =
      detection.landmarks;

    const leftEye =
      landmarks.getLeftEye();

    const rightEye =
      landmarks.getRightEye();

    const nose =
      landmarks.getNose();

    /*
     * Nose position
     */
    const leftX =
      leftEye[0].x;

    const rightX =
      rightEye[3].x;

    const noseX =
      nose[3].x;

    const center =
      (leftX + rightX) / 2;

    /*
     * =========================
     * LOOK LEFT
     * =========================
     */
    if (
      step === 0 &&
      noseX > center + 10
    ) {
      setStep(1);
      setInstruction(steps[1]);

      setLivenessFlags(
        (prev) => ({
          ...prev,
          turnPassed: true,
        })
      );

      return;
    }

    /*
     * =========================
     * LOOK RIGHT
     * =========================
     */
    if (
      step === 1 &&
      noseX < center - 10
    ) {
      setStep(2);
      setInstruction(steps[2]);

      return;
    }

    /*
     * =========================
     * SMILE
     * =========================
     */
    if (
      step === 2 &&
      detection.expressions.happy > 0.75
    ) {
      setLivenessFlags(
        (prev) => ({
          ...prev,
          smilePassed: true,
        })
      );

      setStep(3);
      setInstruction(steps[3]);

      /*
       * Capture selfie after smile
       */
      const selfie =
        captureSelfie();

      if (!selfie) {
        alert(
          "Selfie capture failed. Please try again."
        );

        setStep(2);
        setInstruction(steps[2]);

        return;
      }

      /*
       * Move to Face Match
       */
      setTimeout(() => {
        setStep(4);

        finishVerification(
          selfie
        );
      }, 500);
    }
  };

  /*
   * =========================
   * LIVENESS INTERVAL
   * =========================
   */
  useEffect(() => {
    if (
      !modelsLoaded ||
      completed ||
      loading
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        checkLiveness();
      }, 500);

    return () =>
      clearInterval(interval);
  }, [
    modelsLoaded,
    completed,
    loading,
    step,
  ]);

  /*
   * =========================
   * NO PENSIONER
   * =========================
   */
  if (!pensioner) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 font-sans">

        <div className="bg-white rounded-xl shadow-lg p-8">

          <h2 className="text-3xl font-bold text-center text-[#162447] mb-8">
            Liveness → Face Match
          </h2>

          {/* ID CARD STATUS */}
          {imageMethod === "idCard" && (
            <div className="mb-6 grid md:grid-cols-2 gap-4">

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700">
                  🆔 ID Front
                </p>

                {frontIdUrl && (
                  <img
                    src={frontIdUrl}
                    alt="ID Front"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700">
                  🆔 ID Back
                </p>

                {backIdUrl && (
                  <img
                    src={backIdUrl}
                    alt="ID Back"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

            </div>
          )}

          {/* PENSIONER INFO */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">

            <p>
              <strong>Name:</strong>{" "}
              {pensioner.nameEng ||
                pensioner.nameAmh ||
                pensioner.name}
            </p>

            <p>
              <strong>FAYDA:</strong>{" "}
              {pensioner.faydaNumber ||
                faydaNumber}
            </p>

          </div>

          {loading ? (

            <div className="text-center py-20">

              <div className="text-6xl mb-5">
                🔍
              </div>

              <h3 className="text-2xl font-bold text-[#162447]">
                Face Match እየተደረገ ነው...
              </h3>

              <p className="text-gray-500 mt-3">
                Selfie ከSystem Photo ጋር
                እየተመሳከረ ነው።
              </p>

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
                      width: `${
                        ((step + 1) /
                          steps.length) *
                        100
                      }%`,
                    }}
                  />

                </div>

              </div>

              {/* WEBCAM */}
              <div className="flex justify-center">

                <div className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden border-[8px] border-[#162447] shadow-2xl">

                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.9}
                    className="w-full h-full object-cover"
                  />

                </div>

              </div>

              <div className="mt-6 text-center text-gray-600 font-medium">

                {modelsLoaded
                  ? "🟢 Camera Ready"
                  : "⏳ Loading AI Models..."}

              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                እባክዎ በማያ ላይ የሚታየውን
                መመሪያ ይከተሉ።
              </div>

            </>

          ) : (

            <div className="text-center py-12">

              <div className="text-7xl mb-4">
                {result?.verificationStatus ===
                "Verified"
                  ? "✅"
                  : "❌"}
              </div>

              <h2
                className={`text-3xl font-bold ${
                  result?.verificationStatus ===
                  "Verified"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {result?.verificationStatus ===
                "Verified"
                  ? "Verification Successful"
                  : "Verification Failed"}
              </h2>

              {result && (
                <div className="mt-6 bg-gray-50 border rounded-xl p-6 max-w-md mx-auto text-left shadow-sm">

                  <p className="mb-2">
                    <strong>
                      Verification:
                    </strong>{" "}
                    {result.verificationStatus}
                  </p>

                  <p className="mb-2">
                    <strong>
                      Face Match:
                    </strong>{" "}
                    {result.faceMatched
                      ? "✅ Yes"
                      : "❌ No"}
                  </p>

                  <p className="mb-2">
                    <strong>
                      Liveness:
                    </strong>{" "}
                    {result.smilePassed &&
                    result.nodPassed &&
                    result.turnPassed
                      ? "✅ Passed"
                      : "❌ Failed"}
                  </p>

                  <p>
                    <strong>
                      Similarity:
                    </strong>{" "}
                    {Number(
                      result.matchPercentage || 0
                    ).toFixed(2)}
                    %
                  </p>

                </div>
              )}

              <button
                onClick={() =>
                  navigate("/verify")
                }
                className="mt-8 bg-[#162447] hover:bg-[#101b36] text-white font-semibold px-8 py-3 rounded-lg text-lg shadow"
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
