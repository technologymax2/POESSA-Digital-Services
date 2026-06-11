import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./AgentVideoPage.css";

const socket = io(
  process.env.REACT_APP_BACKEND_URL ||
    "https://poessa-digital-services-1.onrender.com",
  {
    transports: ["websocket", "polling"],
  }
);

const AgentVideoPage = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callConnected, setCallConnected] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    initializeMedia();

const storedUser = localStorage.getItem("user");

if (!storedUser) {
  alert("Please login first");
  window.location.href = "/login";
  return;
}

const user = JSON.parse(storedUser);

const loggedEmployeeId = user.id;

console.log(
  "Employee ID:",
  loggedEmployeeId
);

setEmployeeId(loggedEmployeeId);

    setEmployeeId(loggedEmployeeId);

    socket.emit("register-user", {
      userId: loggedEmployeeId,
      role: "employee",
    });

    console.log(
      "Employee Registered:",
      loggedEmployeeId
    );

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleRemoteEnd);

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");

      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setStream(mediaStream);

      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error(error);
      alert("Camera Access Denied");
    }
  };

  const handleIncomingCall = (callData) => {
    console.log("Incoming Call:", callData);

    setIncomingCalls((prev) => {
      const exists = prev.find(
        (call) =>
          call.pensionerId ===
          callData.pensionerId
      );

      if (exists) return prev;

      return [...prev, callData];
    });
  };

  const handleRemoteEnd = () => {
    console.log("Call Ended");

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

  const answerCall = (callData) => {
    if (!stream) {
      alert("Camera not ready");
      return;
    }

    if (callConnected) {
      alert("You are already in a call");
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
        pensionerId: callData.pensionerId,
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
      console.error("Peer Error:", err);
    });

    peer.signal(callData.signalData);

    peerRef.current = peer;

    setIncomingCalls((prev) =>
      prev.filter(
        (call) =>
          call.pensionerId !==
          callData.pensionerId
      )
    );
  };

  const rejectCall = (callData) => {
    socket.emit("reject-call", {
      pensionerId: callData.pensionerId,
    });

    setIncomingCalls((prev) =>
      prev.filter(
        (call) =>
          call.pensionerId !==
          callData.pensionerId
      )
    );
  };

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
      remoteVideo.current.srcObject = null;
    }

    setCallConnected(false);
    setActiveCall(null);
  };

  return (
    <div className="agent-page">
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
      </div>

      <div className="video-section">
        <h2>Employee Call Center</h2>

        {activeCall && (
          <div className="active-user">
            Current Call :
            {" "}
            {activeCall.pensionerName ||
              activeCall.pensionerId}
          </div>
        )}

        <div className="video-grid">
          <div className="video-card">
            <h3>Your Camera</h3>

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="video-box"
            />
          </div>

          <div className="video-card">
            <h3>Pensioner Video</h3>

            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="video-box"
            />
          </div>
        </div>

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