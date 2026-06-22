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
  // CHECK STATUS
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
      // ✅ FIXED ROUTE (MATCH YOUR BACKEND)
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
        padding: 30,
        maxWidth: 450,
        margin: "30px auto",
        textAlign: "center",
        fontFamily: "sans-serif",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: 60 }}>🎉</div>

      <h3 style={{ color: "#162447" }}>
        Verification Completed
      </h3>

      <p style={{ color: "#475569" }}>
        የጡረተኛው{" "}
        <strong>{pensionerData?.nameAmh || "User"}</strong>{" "}
        መረጃ ተሳክቷል
      </p>

      {/* =========================
          STATUS CHECK SECTION
      ========================= */}
      <div
        style={{
          marginTop: 20,
          background: "#f8fafc",
          padding: 20,
          borderRadius: 10,
        }}
      >
        <h4>🔍 Check Verification Status</h4>

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
            padding: 12,
            borderRadius: 8,
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
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>

        {/* ERROR */}
        {error && (
          <p style={{ color: "red", marginTop: 10 }}>
            {error}
          </p>
        )}

        {/* RESULT */}
        {statusResult && (
          <div
            style={{
              marginTop: 15,
              padding: 15,
              borderRadius: 8,
              background:
                statusResult.verificationStatus === "Verified"
                  ? "#dcfce7"
                  : statusResult.verificationStatus === "Failed"
                  ? "#fee2e2"
                  : "#fef9c3",
            }}
          >
            <strong>Status: </strong>

            {statusResult.verificationStatus === "Verified" &&
              "✅ Approved"}

            {statusResult.verificationStatus === "Failed" &&
              "❌ Rejected"}

            {statusResult.verificationStatus === "Pending" &&
              "⏳ Pending"}

            {statusResult.comment && (
              <p style={{ fontSize: 12, marginTop: 5 }}>
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
