import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./AgentVideoPage.css";

const socket = io(
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
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
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
        alert("Camera access denied");
      }
    };

    const handleIncomingCall = (callData) => {
      setIncomingCalls((prev) => {
        const exists = prev.find(
          (item) =>
            item.pensionerId === callData.pensionerId
        );

        if (exists) {
          return prev;
        }

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

    initializeMedia();

    const savedAgentId =
      localStorage.getItem("agentId") ||
      `AGENT_${Date.now()}`;

    setAgentId(savedAgentId);

    socket.emit("register-user", {
      userId: savedAgentId,
      role: "agent",
    });

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    socket.on(
      "call-ended",
      handleRemoteEnd
    );

    return () => {
      socket.off(
        "incoming-call",
        handleIncomingCall
      );

      socket.off(
        "call-ended",
        handleRemoteEnd
      );

      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const answerCall = (callData) => {
    if (callConnected) {
      alert(
        "አሁን በሌላ ጥሪ ላይ ነዎት"
      );
      return;
    }

    if (!stream) {
      alert("Camera not ready");
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
        agentId,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject =
          remoteStream;
      }
    });

    peer.signal(callData.signalData);

    peerRef.current = peer;

    setIncomingCalls((prev) =>
      prev.filter(
        (item) =>
          item.pensionerId !==
          callData.pensionerId
      )
    );
  };

  const rejectCall = (callData) => {
    socket.emit("reject-call", {
      pensionerId:
        callData.pensionerId,
    });

    setIncomingCalls((prev) =>
      prev.filter(
        (item) =>
          item.pensionerId !==
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
        <h2>Agent Call Center</h2>

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
            <h3>Agent Camera</h3>

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="video-box"
            />
          </div>

          <div className="video-card">
            <h3>Pensioner</h3>

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