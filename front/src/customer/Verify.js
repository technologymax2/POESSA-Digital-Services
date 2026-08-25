import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Sidebar";
import WebcamCapture from "../components/WebcamCapture";
import ImageUpload from "../components/ImageUpload";
import CaptureIDCard from "../components/CaptureIDCard";
import {
  searchPensioner,
  getCurrentRenewal,
} from "../services/api";

const API_URL = process.env.REACT_APP_API_URL.replace("/api", "");

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pensioner, setPensioner] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageMethod, setImageMethod] = useState("idCard");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
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

  const handleCapture = (file, image, descriptor) => {
    setCapturedImage(image);
    setPreview(image);
    setFaceDescriptor(descriptor);
    setImageFile(null);
  };

  const handleUpload = (file, imagePreview, descriptor) => {
    setImageFile(file);
    setPreview(imagePreview);
    setCapturedImage(null);
    setFaceDescriptor(descriptor);
  };

  const handleIdCardSuccess = ({ faydaNumber, pensioner: foundPensioner }) => {
    if (foundPensioner) {
      setPensioner(foundPensioner);
    } else {
      setSearch(faydaNumber);
      executeSearch(faydaNumber);
    }
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
        <div className="text-center mt-20 font-bold text-lg text-gray-600">Loading Renewal...</div>
      </>
    );
  }
  
  if (renewalStatus === "NONE") {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-16 px-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3 text-amber-800">No Renewal Available</h2>
            <p className="text-amber-700">The administrator has not published a renewal period.</p>
          </div>
        </div>
      </>
    );
  }

  if (renewalStatus === "NOT_STARTED") {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-16 px-4">
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3 text-[#162447]">Renewal Has Not Started</h2>
            <p className="mb-3 text-gray-700">{renewal?.message}</p>
            <p className="text-gray-500">Starts on</p>
            <h3 className="font-bold text-xl text-[#162447]">{new Date(renewal.startDate).toLocaleString()}</h3>
          </div>
        </div>
      </>
    );
  }

  if (renewalStatus === "EXPIRED") {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-16 px-4">
          <div className="bg-red-50 border border-red-300 rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold mb-3 text-red-800">Renewal Period Has Ended</h2>
            <p className="mb-3 text-red-700">{renewal?.message}</p>
            <p className="text-gray-500">Ended on</p>
            <h3 className="font-bold text-xl text-red-900">{new Date(renewal.endDate).toLocaleString()}</h3>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      {renewalStatus === "ACTIVE" && (
        <div className="max-w-6xl mx-auto p-6 font-sans">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-3xl font-bold text-center text-[#162447] mb-8">Pensioner Verification</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input 
                type="text" 
                value={search} 
                placeholder="Enter Pensioner ID or Fayda Number" 
                onChange={(e) => setSearch(e.target.value)} 
                className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:border-[#162447] transition" 
              />
              <button 
                onClick={handleSearchClick} 
                disabled={loading}
                className="bg-[#162447] hover:bg-[#101b36] text-white font-semibold px-8 py-3 rounded-lg transition shadow cursor-pointer"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {pensioner?.alreadyVerified && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center mt-6">
                <h2 className="text-2xl font-bold text-green-700">✅ Already Verified</h2>
                <p className="mt-2 text-green-800">This pensioner has already completed the renewal verification for this period.</p>
              </div>
            )}
            
            {pensioner && !pensioner.alreadyVerified && (
              <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-[#162447]">Registered Information</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <p><strong>ID:</strong> {pensioner.pensionerId}</p>
                    <p><strong>Name:</strong> {pensioner.nameEng}</p>
                    <p><strong>Fayda:</strong> {pensioner.faydaNumber}</p>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-[#162447]">Registered Photo</h4>
                    <img src={`${API_URL}${pensioner.image}`} alt={pensioner.nameEng} className="w-64 h-64 object-cover rounded-lg border border-gray-200 shadow-sm" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-[#162447]">Verification Method & Photo</h3>
                  
                  <div className="flex gap-2 mb-5 flex-wrap">
                    <button 
                      type="button" 
                      onClick={() => setImageMethod("idCard")} 
                      className={`px-4 py-2 rounded-lg font-medium transition ${imageMethod === "idCard" ? "bg-[#162447] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      🆔 ID Scan
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setImageMethod("camera")} 
                      className={`px-4 py-2 rounded-lg font-medium transition ${imageMethod === "camera" ? "bg-[#162447] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      📷 Camera
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setImageMethod("upload")} 
                      className={`px-4 py-2 rounded-lg font-medium transition ${imageMethod === "upload" ? "bg-[#162447] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      📁 Upload
                    </button>
                  </div>

                  {imageMethod === "idCard" ? (
                    <CaptureIDCard onSuccess={handleIdCardSuccess} />
                  ) : imageMethod === "camera" ? (
                    <WebcamCapture onCapture={handleCapture} preview={preview} />
                  ) : (
                    <ImageUpload onResult={handleUpload} />
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyIdentity}
                    disabled={renewalStatus !== "ACTIVE"}
                    className="w-full mt-6 py-3.5 rounded-lg text-white font-bold transition shadow-md bg-[#162447] hover:bg-[#101b36] cursor-pointer"
                  >
                    Proceed to Liveness & Verify Identity →
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
