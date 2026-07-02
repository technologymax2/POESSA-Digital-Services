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

const AgentVideoPage = () => {

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);

  const [incomingCalls, setIncomingCalls] = useState([]);

  const [activeCall, setActiveCall] =
    useState(null);

  const [callConnected, setCallConnected] =
    useState(false);

  const [employeeId, setEmployeeId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loadingPensioner,
    setLoadingPensioner] =
    useState(false);

  const [pensioner,
    setPensioner] =
    useState(null);

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

        alert("Camera access denied.");

      }

    }, []);

  useEffect(() => {

    initializeMedia();

    const stored =
      localStorage.getItem("user");

    if (!stored) {

      alert("Login required");

      window.location.href = "/login";

      return;

    }

    const user =
      JSON.parse(stored);

    setEmployeeId(user.id);

    socket.emit("register-user", {

      userId: user.id,

      role: "employee",

    });

  }, [initializeMedia]);

  const searchPensioner =
    async () => {

      if (!search.trim()) {

        alert(
          "Enter Fayda Number or Pensioner ID"
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

    /* ===========================
      SOCKET EVENTS
  =========================== */

  useEffect(() => {

    socket.on("incoming-call", handleIncomingCall);

    socket.on("call-ended", handleRemoteEnd);

    socket.on("remove-call", ({ pensionerId }) => {

      setIncomingCalls((prev) =>
        prev.filter(
          (c) => c.pensionerId !== pensionerId
        )
      );

    });

    return () => {

      socket.off("incoming-call");

      socket.off("call-ended");

      socket.off("remove-call");

    };

  }, []);

  const handleIncomingCall = (callData) => {

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

  const handleRemoteEnd = () => {

    if (peerRef.current) {

      peerRef.current.destroy();

      peerRef.current = null;

    }

    if (remoteVideo.current) {

      remoteVideo.current.srcObject = null;

    }

    setCallConnected(false);

    setActiveCall(null);

  };

  /* ===========================
      ANSWER CALL
  =========================== */

  const answerCall = (callData) => {

    if (!stream) {

      alert("Camera not ready");

      return;

    }

    if (callConnected) {

      alert("Already connected.");

      return;

    }

    setActiveCall(callData);

    setCallConnected(true);

    const peer = new Peer({

      initiator: false,

      trickle: false,

      stream,

    });

    peer.on("signal", (signal) => {

      socket.emit("answer-call", {

        signal,

        pensionerId:

          callData.pensionerId,

        agentId: employeeId,

      });

    });

    peer.on("stream", (remoteStream) => {

      if (remoteVideo.current) {

        remoteVideo.current.srcObject =

          remoteStream;

      }

    });

    peer.on("error", (err) => {

      console.error(err);

    });

    peer.signal(callData.signalData);

    peerRef.current = peer;

    setIncomingCalls((prev) =>

      prev.filter(

        (c) =>

          c.pensionerId !==

          callData.pensionerId

      )

    );

  };

  /* ===========================
      REJECT CALL
  =========================== */

  const rejectCall = (callData) => {

    socket.emit("reject-call", {

      pensionerId:

        callData.pensionerId,

    });

    setIncomingCalls((prev) =>

      prev.filter(

        (c) =>

          c.pensionerId !==

          callData.pensionerId

      )

    );

  };

  /* ===========================
      END CALL
  =========================== */

  const endCall = () => {

    if (peerRef.current) {

      peerRef.current.destroy();

      peerRef.current = null;

    }

    socket.emit("end-call", {

      pensionerId:

        activeCall?.pensionerId,

    });

    if (remoteVideo.current) {

      remoteVideo.current.srcObject =

        null;

    }

    setCallConnected(false);

    setActiveCall(null);

  };  return (
    <div className="agent-page">

      {/* ================= LEFT PANEL ================= */}

      <div className="queue-panel">

        <h2>Incoming Calls</h2>

        <div className="call-count">
          {incomingCalls.length} Call(s)
        </div>

        {incomingCalls.length === 0 && (
          <div className="no-calls">
            No Incoming Calls
          </div>
        )}

        {incomingCalls.map((call) => (

          <div
            key={call.pensionerId}
            className="call-card"
          >

            <h4>
              {call.pensionerName ||
                call.pensionerId}
            </h4>

            <div className="call-actions">

              <button
                className="answer-btn"
                disabled={callConnected}
                onClick={() =>
                  answerCall(call)
                }
              >
                Answer
              </button>

              <button
                className="reject-btn"
                disabled={callConnected}
                onClick={() =>
                  rejectCall(call)
                }
              >
                Reject
              </button>

            </div>

          </div>

        ))}

        <hr />

        <h3>
          Search Pensioner
        </h3>

        <input
          type="text"
          placeholder="Fayda Number / Pensioner ID"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <button
          className="search-btn"
          onClick={searchPensioner}
        >
          Search
        </button>

        {loadingPensioner && (
          <p>Loading...</p>
        )}

        {pensioner && (

          <div className="pensioner-card">

            <img
              src={
                API +
                pensioner.image
              }
              alt=""
              className="registered-photo"
            />

            <h3>
              {pensioner.nameEng}
            </h3>

            <p>
              <strong>ID:</strong>
              {" "}
              {pensioner.pensionerId}
            </p>

            <p>
              <strong>Fayda:</strong>
              {" "}
              {pensioner.faydaNumber}
            </p>

            <p>
              <strong>TIN:</strong>
              {" "}
              {pensioner.tin}
            </p>

            <p>
              <strong>Gender:</strong>
              {" "}
              {pensioner.gender}
            </p>

            <p>
              <strong>Phone:</strong>
              {" "}
              {pensioner.phone}
            </p>

            <p>
              <strong>Branch:</strong>
              {" "}
              {pensioner.poessaBranch}
            </p>

            <p>
              <strong>Bank:</strong>
              {" "}
              {pensioner.bankNameEng}
            </p>

            <p>
              <strong>Amount:</strong>
              {" "}
              {pensioner.pensionAmount}
            </p>

          </div>

        )}

      </div>

      {/* ================= RIGHT PANEL ================= */}

      <div className="video-section">

        <h2>
          Employee Call Center
        </h2>

        {activeCall && (

          <div className="active-user">

            Current Call :

            {" "}

            {activeCall.pensionerId}

          </div>

        )}

        <div className="video-wrapper">

          {/* BIG VIDEO */}

          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="remote-video"
          />

          {/* SMALL VIDEO */}

          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="local-video"
          />

        </div>  return (
    <div className="agent-page">

      {/* ================= LEFT PANEL ================= */}

      <div className="queue-panel">

        <h2>Incoming Calls</h2>

        <div className="call-count">
          {incomingCalls.length} Call(s)
        </div>

        {incomingCalls.length === 0 && (
          <div className="no-calls">
            No Incoming Calls
          </div>
        )}

        {incomingCalls.map((call) => (

          <div
            key={call.pensionerId}
            className="call-card"
          >

            <h4>
              {call.pensionerName || call.pensionerId}
            </h4>

            <div className="call-actions">

              <button
                className="answer-btn"
                disabled={callConnected}
                onClick={() => answerCall(call)}
              >
                Answer
              </button>

              <button
                className="reject-btn"
                disabled={callConnected}
                onClick={() => rejectCall(call)}
              >
                Reject
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* ================= RIGHT PANEL ================= */}

      <div className="video-section">

        <h2>Employee Video Verification</h2>

        {activeCall && (

          <div className="active-user">

            Current Call :
            {" "}
            {activeCall.pensionerId}

          </div>

        )}

        {/* ---------------- Videos ---------------- */}

        <div className="video-layout">

          {/* Pensioner video - Large */}

          <div className="remote-video-wrapper">

            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="remote-video"
            />

          </div>

          {/* Employee video - Small */}

          <div className="local-video-wrapper">

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="local-video"
            />

          </div>

        </div>

        {/* ---------------- Pensioner Information ---------------- */}

        {pensioner && (

          <div className="pensioner-card">

            <div className="photo-section">

              <img
                src={`${API_URL}${pensioner.image}`}
                alt={pensioner.nameEng}
                className="pensioner-photo"
              />

            </div>

            <div className="info-section">

              <h3>{pensioner.nameEng}</h3>

              <p>
                <strong>Amharic Name:</strong>{" "}
                {pensioner.nameAmh}
              </p>

              <p>
                <strong>Pensioner ID:</strong>{" "}
                {pensioner.pensionerId}
              </p>

              <p>
                <strong>Fayda:</strong>{" "}
                {pensioner.faydaNumber}
              </p>

              <p>
                <strong>Gender:</strong>{" "}
                {pensioner.gender}
              </p>

              <p>
                <strong>Age:</strong>{" "}
                {pensioner.age}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {pensioner.phone}
              </p>

              <p>
                <strong>POESSA Branch:</strong>{" "}
                {pensioner.poessaBranch}
              </p>

              <p>
                <strong>Bank:</strong>{" "}
                {pensioner.bankNameEng}
              </p>

              <p>
                <strong>Bank Branch:</strong>{" "}
                {pensioner.bankBranch}
              </p>

              <p>
                <strong>Pension Amount:</strong>{" "}
                {pensioner.pensionAmount}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {pensioner.addressEng}
              </p>

            </div>

          </div>

        )}

        {/* ---------------- Search ---------------- */}

        {callConnected && (

          <div className="verification-panel">

            <input
              type="text"
              value={search}
              placeholder="Enter Fayda Number"
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />

            <button
              onClick={searchPensionerData}
              className="search-btn"
            >
              Search
            </button>

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
