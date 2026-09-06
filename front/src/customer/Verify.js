import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Sidebar";
import WebcamCapture from "../components/WebcamCapture";
import ImageUpload from "../components/ImageUpload";
import CaptureIDCard from "./CaptureIDCard";

const API_BASE_URL =
  "https://poessa-digital-services-1.onrender.com";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [pensioner, setPensioner] = useState(null);

  const [capturedImage, setCapturedImage] =
    useState(null);

  const [imageFile, setImageFile] =
    useState(null);

  const [preview, setPreview] = useState(null);

  const [faceDescriptor, setFaceDescriptor] =
    useState(null);

  /*
   * =========================
   * ID CARD URL STATES
   * =========================
   */
  const [frontIdUrl, setFrontIdUrl] =
    useState(null);

  const [backIdUrl, setBackIdUrl] =
    useState(null);

  const [idFaydaNumber, setIdFaydaNumber] =
    useState("");

  const [imageMethod, setImageMethod] =
    useState("idCard");

  const [renewal, setRenewal] =
    useState(null);

  const [renewalLoading, setRenewalLoading] =
    useState(true);

  const [renewalStatus, setRenewalStatus] =
    useState("");

  /*
   * =========================
   * SEARCH PENSIONER
   * =========================
   */
  const executeSearch = useCallback(
    async (query) => {
      if (!query.trim()) return;

      try {
        setLoading(true);

        setCapturedImage(null);
        setImageFile(null);
        setPreview(null);
        setFaceDescriptor(null);

        const response = await fetch(
          `${API_BASE_URL}/api/pensioners/search?query=${encodeURIComponent(
            query.trim()
          )}`
        );

        const res = await response.json();

        if (
          !res.success ||
          !res.data ||
          res.data.length === 0
        ) {
          setPensioner(null);

          alert("Pensioner not found.");

          return;
        }

        const found = res.data[0];

        setPensioner(found);

        if (found.alreadyVerified) {
          alert(
            "This pensioner has already completed verification for the current renewal period."
          );
        }
      } catch (err) {
        console.error(err);

        setPensioner(null);

        alert(
          "Pensioner not found or server error."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
   * =========================
   * RENEWAL
   * =========================
   */
  const loadRenewal = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/renewals/current`
      );

      const res = await response.json();

      setRenewal(res.data);
      setRenewalStatus(
        res.status || "ACTIVE"
      );
    } catch (err) {
      console.error(err);

      setRenewal(null);

      setRenewalStatus("ACTIVE");
    } finally {
      setRenewalLoading(false);
    }
  };

  useEffect(() => {
    loadRenewal();
  }, []);

  /*
   * =========================
   * URL PID
   * =========================
   */
  useEffect(() => {
    const pid = searchParams.get("pid");

    if (pid) {
      setSearch(pid);
      executeSearch(pid);
    }
  }, [searchParams, executeSearch]);

  /*
   * =========================
   * SEARCH BUTTON
   * =========================
   */
  const handleSearchClick = () => {
    if (renewalStatus !== "ACTIVE") {
      alert("Renewal is not currently active.");
      return;
    }

    if (!search.trim()) {
      alert(
        "Enter Pensioner ID or Fayda Number."
      );
      return;
    }

    executeSearch(search);
  };

  /*
   * =========================
   * CAMERA RESULT
   * =========================
   */
  const handleCapture = (
    file,
    image,
    descriptor
  ) => {
    setCapturedImage(image);
    setPreview(image);
    setFaceDescriptor(descriptor);
    setImageFile(null);
  };

  /*
   * =========================
   * UPLOAD RESULT
   * =========================
   */
  const handleUpload = (
    file,
    imagePreview,
    descriptor
  ) => {
    setImageFile(file);
    setPreview(imagePreview);
    setCapturedImage(null);
    setFaceDescriptor(descriptor);
  };

  /*
   * =========================
   * ID CARD SUCCESS
   * =========================
   */
  const handleIdCardSuccess = ({
    faydaNumber,
    frontIdUrl,
    backIdUrl,
    pensioner: foundPensioner,
  }) => {
    /*
     * IMPORTANT:
     * Keep both ID URLs in Verify state.
     */
    setIdFaydaNumber(faydaNumber);

    setFrontIdUrl(frontIdUrl);
    setBackIdUrl(backIdUrl);

    /*
     * Keep the DB pensioner object.
     */
    if (foundPensioner) {
      setPensioner(foundPensioner);
      setSearch(
        foundPensioner.faydaNumber ||
          faydaNumber
      );
    } else {
      setSearch(faydaNumber);
      executeSearch(faydaNumber);
    }
  };

  /*
   * =========================
   * PROCEED TO LIVENESS
   * =========================
   */
  const handleVerifyIdentity = () => {
    if (!pensioner) {
      alert(
        "⚠️ እባክዎ መጀመሪያ pensioner መረጃ ከDB ያረጋግጡ።"
      );
      return;
    }

    /*
     * ID CARD WORKFLOW
     */
    if (imageMethod === "idCard") {
      if (!frontIdUrl || !backIdUrl) {
        alert(
          "⚠️ እባክዎ የID Front እና ID Back ፎቶዎችን ሁለቱንም ያስገቡ።"
        );
        return;
      }

      if (idFaydaNumber.length !== 16) {
        alert(
          "⚠️ FAYDA ቁጥሩ 16 ዲጂት መሆን አለበት።"
        );
        return;
      }

      /*
       * Send ID URLs to Liveness.
       */
      navigate("/liveness", {
        state: {
          pensioner,

          faydaNumber:
            pensioner.faydaNumber ||
            idFaydaNumber,

          frontIdUrl,
          backIdUrl,

          imageMethod: "idCard",

          imageFile: null,
          capturedImage: null,
          faceDescriptor: null,
        },
      });

      return;
    }

    /*
     * CAMERA / UPLOAD WORKFLOW
     */
    if (!capturedImage && !imageFile) {
      alert(
        "Please capture or upload a verification photo."
      );
      return;
    }

    navigate("/liveness", {
      state: {
        pensioner,

        faydaNumber:
          pensioner.faydaNumber ||
          search,

        frontIdUrl: null,
        backIdUrl: null,

        imageMethod,

        imageFile,
        capturedImage,
        faceDescriptor,
      },
    });
  };

  /*
   * =========================
   * LOADING
   * =========================
   */
  if (renewalLoading) {
    return (
      <>
        <Navbar />

        <div className="text-center mt-20 font-bold text-lg text-gray-600">
          Loading Renewal...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto p-6 font-sans">

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">

          <h2 className="text-3xl font-bold text-center text-[#162447] mb-8">
            Pensioner Verification
          </h2>

          {/* SEARCH */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">

            <input
              type="text"
              value={search}
              placeholder="Enter Pensioner ID or Fayda Number"
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:border-[#162447]"
            />

            <button
              onClick={handleSearchClick}
              disabled={loading}
              className="bg-[#162447] hover:bg-[#101b36] text-white font-semibold px-8 py-3 rounded-lg shadow"
            >
              {loading
                ? "Searching..."
                : "Search"}
            </button>

          </div>

          {/* ALREADY VERIFIED */}
          {pensioner?.alreadyVerified && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">

              <h2 className="text-2xl font-bold text-green-700">
                ✅ Already Verified
              </h2>

              <p className="mt-2 text-green-800">
                This pensioner has already completed
                the renewal verification for this period.
              </p>

            </div>
          )}

          {/* PENSIONER */}
          {pensioner &&
            !pensioner.alreadyVerified && (

              <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-6">

                {/* REGISTERED INFO */}
                <div>

                  <h3 className="text-xl font-semibold mb-4 text-[#162447]">
                    Registered Information
                  </h3>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">

                    <p>
                      <strong>ID:</strong>{" "}
                      {pensioner.pensionerId}
                    </p>

                    <p>
                      <strong>Name:</strong>{" "}
                      {pensioner.nameEng ||
                        pensioner.nameAmh ||
                        pensioner.name}
                    </p>

                    <p>
                      <strong>Fayda:</strong>{" "}
                      {pensioner.faydaNumber}
                    </p>

                  </div>

                  <div className="mt-6">

                    <h4 className="font-semibold mb-3 text-[#162447]">
                      Registered Photo
                    </h4>

                    {pensioner.image && (
                      <img
                        src={
                          pensioner.image.startsWith(
                            "http"
                          )
                            ? pensioner.image
                            : `${API_BASE_URL}${pensioner.image}`
                        }
                        alt={
                          pensioner.nameEng ||
                          pensioner.name
                        }
                        className="w-64 h-64 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                    )}

                  </div>

                </div>

                {/* VERIFICATION METHOD */}
                <div>

                  <h3 className="text-xl font-semibold mb-4 text-[#162447]">
                    Verification Method & Photo
                  </h3>

                  <div className="flex gap-2 mb-5 flex-wrap">

                    <button
                      type="button"
                      onClick={() =>
                        setImageMethod("idCard")
                      }
                      className={`px-4 py-2 rounded-lg font-medium ${
                        imageMethod === "idCard"
                          ? "bg-[#162447] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      🆔 ID Scan
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImageMethod("camera")
                      }
                      className={`px-4 py-2 rounded-lg font-medium ${
                        imageMethod === "camera"
                          ? "bg-[#162447] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      📷 Camera
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImageMethod("upload")
                      }
                      className={`px-4 py-2 rounded-lg font-medium ${
                        imageMethod === "upload"
                          ? "bg-[#162447] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      📁 Upload
                    </button>

                  </div>

                  {imageMethod === "idCard" ? (

                    <CaptureIDCard
                      onSuccess={
                        handleIdCardSuccess
                      }
                    />

                  ) : imageMethod === "camera" ? (

                    <WebcamCapture
                      onCapture={handleCapture}
                      preview={preview}
                    />

                  ) : (

                    <ImageUpload
                      onResult={handleUpload}
                    />

                  )}

                  {/* ID STATUS */}
                  {imageMethod === "idCard" &&
                    frontIdUrl &&
                    backIdUrl && (
                      <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
                        ✅ ID Front + ID Back
                        ፎቶዎች ተይዘዋል።
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={
                      handleVerifyIdentity
                    }
                    disabled={
                      imageMethod === "idCard"
                        ? !pensioner ||
                          !frontIdUrl ||
                          !backIdUrl ||
                          idFaydaNumber.length !== 16
                        : !capturedImage &&
                          !imageFile
                    }
                    className="w-full mt-6 py-3.5 rounded-lg text-white font-bold shadow-md bg-[#162447] hover:bg-[#101b36] disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Proceed to Liveness & Face Match →
                  </button>

                </div>

              </div>
            )}

        </div>
      </div>
    </>
  );
};

export default Verify;
