import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import WebcamCapture from "../components/WebcamCapture";
import ImageUpload from "../components/ImageUpload";
import Loader from "../components/Loader";
import {
  searchPensioner,
  verifyPensioner,
  getCurrentRenewal,
} from "../services/api";

import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL.replace("/api", "");

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pensioner, setPensioner] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageMethod, setImageMethod] = useState("camera");
  const [faceDescriptor, setFaceDescriptor] = useState(null); // አዲስ state
  const navigate = useNavigate();
  const [renewal, setRenewal] = useState(null);
const [renewalLoading, setRenewalLoading] = useState(true);
const [renewalStatus, setRenewalStatus] = useState("");

  const executeSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setCapturedImage(null);
      setImageFile(null);
      setPreview(null);
      const res = await searchPensioner(query);
      if (!res.data.success || res.data.data.length === 0) {
        setPensioner(null);
        alert("Pensioner not found.");
        return;
      }
      setPensioner(res.data.data[0]);
      if (res.data.data[0].alreadyVerified) {
  alert("This pensioner has already completed verification for the current renewal period.");
}
    } catch (err) {
      console.error(err);
      setPensioner(null);
      alert(err.response?.data?.message || "Pensioner not found.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
  loadRenewal();
}, []);

const loadRenewal = async () => {
  try {
    const res = await getCurrentRenewal();

    setRenewal(res.data.data);
    setRenewalStatus(res.data.status);

  } catch (err) {
    console.error(err);

    setRenewal(null);
    setRenewalStatus("NONE");
  } finally {
    setRenewalLoading(false);
  }
};


  
  useEffect(() => {
    const pid = searchParams.get("pid");
    if (pid) {
      setSearch(pid);
      executeSearch(pid);
    }
  }, [searchParams, executeSearch]);

  const handleSearchClick = () => {
if (renewalStatus !== "ACTIVE") {
  alert("Renewal is not currently active.");
  return;
}

  if (!search.trim()) {
    alert("Enter Pensioner ID or Fayda Number.");
    return;
  }

  executeSearch(search);
};
  // የፊት መለኪያውን (descriptor) ለመቀበል የተሻሻለ
  const handleCapture = (file, image, descriptor) => {
  console.log("Descriptor:", descriptor);
  console.log("Length:", descriptor?.length);

  setCapturedImage(image);
  setPreview(image);
  setFaceDescriptor(descriptor);
  setImageFile(null);
};

  const handleUpload = (file, imagePreview, descriptor) => {
  console.log("File:", file);
  console.log("Preview:", imagePreview);
  console.log("Descriptor:", descriptor);

  setImageFile(file);
  setPreview(imagePreview);
  setCapturedImage(null);
  setFaceDescriptor(descriptor);
};

  const handleVerifyIdentity = () => {
  if (!capturedImage && !imageFile) {
    alert("Please capture or upload a verification photo.");
    return;
  }

  navigate("/liveness", {
    state: {
      pensioner,
      imageFile,
      capturedImage,
      faceDescriptor,
    },
  });
};


if (renewalLoading) {
  return (
    <>
      <Navbar />
      <Loader fullScreen text="Loading Renewal..." />
    </>
  );
}
  
if (renewalStatus === "NONE") {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-16">
        <div className="bg-yellow-100 border border-yellow-400 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            No Renewal Available
          </h2>

          <p>
            The administrator has not published a renewal period.
          </p>
        </div>
      </div>
    </>
  );
}


  if (renewalStatus === "NOT_STARTED") {
  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-16">

        <div className="bg-blue-100 border border-blue-400 rounded-xl p-8 text-center">

          <h2 className="text-2xl font-bold mb-3">
            Renewal Has Not Started
          </h2>

          <p className="mb-3">
            {renewal?.message}
          </p>

          <p>
            Starts on
          </p>

          <h3 className="font-bold text-xl">
            {new Date(
              renewal.startDate
            ).toLocaleString()}
          </h3>

        </div>

      </div>

    </>
  );
}


if (renewalStatus === "EXPIRED") {
  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-16">

        <div className="bg-red-100 border border-red-400 rounded-xl p-8 text-center">

          <h2 className="text-2xl font-bold mb-3">
            Renewal Period Has Ended
          </h2>

          <p className="mb-3">
            {renewal?.message}
          </p>

          <p>
            Ended on
          </p>

          <h3 className="font-bold text-xl">
            {new Date(
              renewal.endDate
            ).toLocaleString()}
          </h3>

        </div>

      </div>

    </>
  );
}

  
  return (
    <>
      <Navbar />


      {loading && <Loader fullScreen size="lg" text="Processing..." />}
      {renewalStatus === "ACTIVE" && (
<div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Pensioner Verification</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input type="text" value={search} placeholder="Enter Pensioner ID or Fayda Number" onChange={(e) => setSearch(e.target.value)} className="flex-1 border rounded-lg p-3" />
            <button onClick={handleSearchClick} className="bg-blue-700 hover:bg-blue-800 text-white px-8 rounded-lg">Search</button>
          </div>

{pensioner?.alreadyVerified && (
  <div className="bg-green-100 border border-green-400 rounded-lg p-6 text-center mt-6">
    <h2 className="text-2xl font-bold text-green-700">
      ✅ Already Verified
    </h2>

    <p className="mt-2">
      This pensioner has already completed the renewal verification for this period.
    </p>
  </div>
)}

          
          {pensioner && !pensioner.alreadyVerified && (
            <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Registered Information</h3>
                <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                  <p><strong>ID:</strong> {pensioner.pensionerId}</p>
                  <p><strong>Name:</strong> {pensioner.nameEng}</p>
                  <p><strong>Fayda:</strong> {pensioner.faydaNumber}</p>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Registered Photo</h4>
                  <img src={`${API_URL}${pensioner.image}`} alt={pensioner.nameEng} className="w-64 h-64 object-cover rounded-lg border shadow" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Verification Photo</h3>
                <div className="flex gap-4 mb-5">
                  <button type="button" onClick={() => setImageMethod("camera")} className={`px-5 py-2 rounded-lg ${imageMethod === "camera" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>📷 Camera</button>
                  <button type="button" onClick={() => setImageMethod("upload")} className={`px-5 py-2 rounded-lg ${imageMethod === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>📁 Upload</button>
                </div>

                {imageMethod === "camera" ? (
                  <WebcamCapture onCapture={handleCapture} preview={preview} />
                ) : (
                  <ImageUpload
    onResult={handleUpload}
/>
                )}

                <button
  type="button"
  onClick={handleVerifyIdentity}
  disabled={renewalStatus !== "ACTIVE"}
  className={`w-full mt-6 py-3 rounded-lg text-white ${
  renewalStatus === "ACTIVE"
    ? "bg-green-600 hover:bg-green-700"
    : "bg-gray-400 cursor-not-allowed"
}`}
>
  Verify Identity
</button>
                
              </div>
            </div>
          )}
        </div>
      </div>

)}
      
    </>
  );
};

export default Verify;
