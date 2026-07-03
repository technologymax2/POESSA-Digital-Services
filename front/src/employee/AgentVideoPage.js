import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import Peer from "simple-peer";
import io from "socket.io-client";
import axios from "axios";

import "./AgentVideoPage.css";

const socket = io(
  process.env.REACT_APP_BACKEND_URL ||
    "https://poessa-digital-services-1.onrender.com",
  {
    transports: ["websocket", "polling"],
  }
);

const API =
  process.env.REACT_APP_BACKEND_URL ||
  "https://poessa-digital-services-1.onrender.com";

const API_URL = API;

const AgentVideoPage = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);

  const [incomingCalls, setIncomingCalls] = useState([]);

  const [activeCall, setActiveCall] = useState(null);

  const [callConnected, setCallConnected] =
    useState(false);

  const [employeeId, setEmployeeId] =
    useState("");

  const [search, setSearch] = useState("");

  const [loadingPensioner,
    setLoadingPensioner] =
    useState(false);

  const [pensioner, setPensioner] =
    useState(null);

  /* ==========================
      CAMERA
  ========================== */

  const initializeMedia =
    useCallback(async () => {

      try {

        const mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        setStream(mediaStream);

        if (myVideo.current) {
          myVideo.current.srcObject =
            mediaStream;
        }

      } catch (err) {

        console.error(err);

        alert("Camera permission denied.");

      }

    }, []);

  /* ==========================
      LOGIN
  ========================== */

  useEffect(() => {

    initializeMedia();

    const stored =
      localStorage.getItem("user");

    if (!stored) {

      alert("Please login first.");

      window.location.href = "/login";

      return;

    }

    const user = JSON.parse(stored);

    setEmployeeId(user.id);

    socket.emit("register-user", {
      userId: user.id,
      role: "employee",
    });

  }, [initializeMedia]);

  /* ==========================
      SEARCH PENSIONER
  ========================== */

  const searchPensioner = async () => {

    if (!search.trim()) {

      alert(
        "Enter Pensioner ID or Fayda Number."
      );

      return;

    }

    try {

      setLoadingPensioner(true);

      const res =
        await axios.get(
          `${API}/api/video/pensioner/${encodeURIComponent(
            search
          )}`
        );

      setPensioner(res.data.data);

    } catch (err) {

      console.error(err);

      setPensioner(null);

      alert(
        err.response?.data?.message ||
          "Pensioner not found."
      );

    } finally {

      setLoadingPensioner(false);

    }

  };

  /* ==========================
      SOCKET EVENTS
  ========================== */

  useEffect(() => {

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    socket.on(
      "call-ended",
      handleRemoteEnd
    );

    socket.on(
      "remove-call",
      ({ pensionerId }) => {

        setIncomingCalls((prev) =>
          prev.filter(
            (c) =>
              c.pensionerId !==
              pensionerId
          )
        );

      }
    );

    return () => {

      socket.off("incoming-call");

      socket.off("call-ended");

      socket.off("remove-call");

    };

  }, []);

  /* ==========================
      INCOMING CALL
  ========================== */

  const handleIncomingCall = (
    callData
  ) => {

    setIncomingCalls((prev) => {

      const exists = prev.find(
        (c) =>
          c.pensionerId ===
          callData.pensionerId
      );

      if (exists) return prev;

      return [...prev, callData];

    });

  };

        {/* ---------------- Search ---------------- */}

        {callConnected && (

          <div className="verification-panel">

            <h3>Pensioner Verification</h3>

            <div className="search-row">

              <input
                type="text"
                className="search-input"
                placeholder="Enter Fayda Number or Pensioner ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button
                className="search-btn"
                onClick={searchPensioner}
              >
                Search
              </button>

            </div>

            {loadingPensioner && (
              <p>Loading...</p>
            )}

          </div>

        )}

        {/* ---------------- Pensioner Information ---------------- */}

        {pensioner && (

          <div className="pensioner-card">

            <div className="photo-section">

              <img
                src={`${API}${pensioner.image}`}
                alt={pensioner.nameEng}
                className="pensioner-photo"
              />

            </div>

            <div className="info-section">

              <h3>{pensioner.nameEng}</h3>

              <p>
                <strong>Pensioner ID :</strong>{" "}
                {pensioner.pensionerId}
              </p>

              <p>
                <strong>Fayda Number :</strong>{" "}
                {pensioner.faydaNumber}
              </p>

              <p>
                <strong>Gender :</strong>{" "}
                {pensioner.gender}
              </p>

              <p>
                <strong>Phone :</strong>{" "}
                {pensioner.phone}
              </p>

              <p>
                <strong>POESSA Branch :</strong>{" "}
                {pensioner.poessaBranch}
              </p>

              <p>
                <strong>Bank :</strong>{" "}
                {pensioner.bankNameEng}
              </p>

              <p>
                <strong>Bank Branch :</strong>{" "}
                {pensioner.bankBranch}
              </p>

              <p>
                <strong>Pension Amount :</strong>{" "}
                {pensioner.pensionAmount}
              </p>

              <p>
                <strong>Address :</strong>{" "}
                {pensioner.addressEng}
              </p>

            </div>

          </div>

        )}

        {/* ---------------- End Call ---------------- */}

        {callConnected && (

          <button
            className="end-btn"
            onClick={endCall}
          >
            End Call
          </button>

        )}

      </div>

    </div>
  );

};

export default AgentVideoPage;
  
