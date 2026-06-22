import React, { useState } from "react";
import axios from "axios";

function VerificationSuccess({ pensionerData }) {
  const [searchFayda, setSearchFayda] = useState(
    pensionerData?.faydaNumber || ""
  );
  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      // ✅ BEST PRACTICE: backend should filter, not frontend
      const res = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/liveness/status/${fayda}`
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
        padding: "30px 20px",
        maxWidth: "450px",
        margin: "30px auto",
        textAlign: "center",
        fontFamily: "sans-serif",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "70px" }}>⏳</div>

      <h3 style={{ color: "#162447" }}>Verification Submitted</h3>

      <p style={{ color: "#475569" }}>
        የጡረተኛው{" "}
        <strong>{pensionerData?.nameAmh || "User"}</strong> መረጃ ተቀብለናል
      </p>

      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h4>🔍 Status Check</h4>

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
            marginTop: "12px",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
        )}

        {statusResult && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              borderRadius: "8px",
              background:
                statusResult.verificationStatus === "Verified"
                  ? "#dcfce7"
                  : statusResult.verificationStatus === "Failed"
                  ? "#fee2e2"
                  : "#fef9c3",
            }}
          >
            <strong>Status: </strong>

            {statusResult.verificationStatus === "Verified" && "✅ Approved"}
            {statusResult.verificationStatus === "Failed" && "❌ Rejected"}
            {statusResult.verificationStatus === "Pending" && "⏳ Pending"}

            {statusResult.comment && (
              <p style={{ fontSize: "12px", marginTop: "5px" }}>
                Reason: {statusResult.comment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccess;
