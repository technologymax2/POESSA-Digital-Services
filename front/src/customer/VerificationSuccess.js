import React, { useState } from "react";
import axios from "axios";

function VerificationSuccess({ pensionerData }) {
  const [searchFayda, setSearchFayda] = useState(
    pensionerData?.faydaNumber || ""
  );

  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // CHECK STATUS FUNCTION
  // =========================
  const checkMyStatus = async () => {
    const fayda = searchFayda.trim();

    setError("");
    setStatusResult(null);

    if (!fayda) {
      setError("⚠️ የፋይዳ ቁጥር ያስገቡ");
      return;
    }

    if (!/^\d{16}$/.test(fayda)) {
      setError("⚠️ 16 ዲጂት የፋይዳ ቁጥር ያስገቡ");
      return;
    }

    setLoading(true);

    try {
      // API call to fetch verification record
      const res = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/liveness/pensioners/${fayda}`
      );

      if (res.data?.success) {
        setStatusResult(res.data.data);
      } else {
        setError("❌ ምንም መረጃ አልተገኘም");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ ሁኔታ መፈተሽ አልተቻለም");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "450px",
        margin: "30px auto",
        textAlign: "center",
        fontFamily: "sans-serif",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>

      <h3 style={{ color: "#162447" }}>Verification Completed</h3>

      <p style={{ color: "#475569" }}>
        የጡረተኛው <strong>{pensionerData?.nameAmh || "User"}</strong> መረጃ
        በተሳካ ሁኔታ ተመዝግቧል።
      </p>

      {/* STATUS CHECK SECTION */}
      <div
        style={{
          marginTop: "20px",
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h4 style={{ margin: "0 0 15px 0" }}>🔍 Check Verification Status</h4>

        <input
          type="text"
          placeholder="16 digit Fayda number"
          value={searchFayda}
          onChange={(e) =>
            setSearchFayda(e.target.value.replace(/\D/g, ""))
          }
          maxLength={16}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
            textAlign: "center",
            fontSize: "16px",
          }}
        />

        <button
          onClick={checkMyStatus}
          disabled={loading}
          style={{
            width: "100%",
            background: "#162447",
            color: "#fff",
            padding: "12px",
            borderRadius: "8px",
            marginTop: "10px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>

        {/* ERROR DISPLAY */}
        {error && (
          <p style={{ color: "#dc2626", marginTop: "10px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        {/* RESULT DISPLAY */}
        {statusResult && (
          <div
            style={{
              marginTop: "20px",
              textAlign: "left",
              background: "#f0fdf4",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
              fontSize: "14px",
            }}
          >
            <p style={{ margin: "5px 0" }}><strong>✅ ስም:</strong> {statusResult.nameAmh || statusResult.name}</p>
            <p style={{ margin: "5px 0" }}><strong>✅ ፋይዳ ቁጥር:</strong> {statusResult.faydaNumber}</p>
            <p style={{ margin: "5px 0" }}><strong>✅ የሁኔታ ማረጋገጫ:</strong> <span style={{color: "#16a34a", fontWeight: "bold"}}>የተረጋገጠ</span></p>
            <p style={{ margin: "5px 0" }}><strong>✅ ቀን:</strong> {new Date(statusResult.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccess;
