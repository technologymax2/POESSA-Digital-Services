import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./VideoCallAccess.css";

const socket = io(
  process.env.REACT_APP_BACKEND_URL ||
    "https://poessa-digital-services-1.onrender.com",
  {
    transports: ["websocket", "polling"],
  }
);

const VideoCallAccess = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [myId, setMyId] = useState("");
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    initializeMedia();

    const user =
      JSON.parse(localStorage.getItem("user")) || {};

    const pensionerId =
      user.id ||
      localStorage.getItem("userId") ||
      `PENSIONER_${Date.now()}`;

    setMyId(pensionerId);

    socket.emit("register-user", {
      userId: pensionerId,
      role: "pensioner",
    });

    socket.on("agent-accepted", handleAgentAccepted);
    socket.on("call-ended", handleCallEnded);
    socket.on("all-agents-busy", handleBusyAgents);
    socket.on("call-rejected", handleRejected);

    return () => {
      socket.off("agent-accepted");
      socket.off("call-ended");
      socket.off("all-agents-busy");
      socket.off("call-rejected");

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
        myVideo.current.srcObject =
          mediaStream;
      }
    } catch (error) {
      console.error(error);
      alert("Camera Access Denied");
    }
  };

  const handleAgentAccepted = (
    data
  ) => {
    setAgentId(data.agentId);
    setCallStatus("connected");
    setStatusMessage("");

    if (peerRef.current) {
      peerRef.current.signal(
        data.signal
      );
    }
  };

  const handleCallEnded = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject =
        null;
    }

    setCallStatus("idle");
    setStatusMessage("");
    setAgentId("");
  };

  const handleBusyAgents = (
    data
  ) => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");
    setStatusMessage(data.message);
  };

  const handleRejected = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");

    alert(
      "ጥሪዎ ተቀባይነት አላገኘም"
    );
  };

  const startCall = () => {
    if (!stream) {
      alert("Camera Not Ready");
      return;
    }

    if (callStatus !== "idle") {
      return;
    }

    setCallStatus("waiting");
    setStatusMessage("");

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on(
      "signal",
      (signalData) => {
        socket.emit(
          "request-agent-call",
          {
            pensionerId:
              myId,
            signalData,
          }
        );
      }
    );

    peer.on(
      "stream",
      (remoteStream) => {
        if (
          remoteVideo.current
        ) {
          remoteVideo.current.srcObject =
            remoteStream;
        }
      }
    );

    peerRef.current = peer;
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    socket.emit("end-call", {
      pensionerId: myId,
      agentId,
    });

    if (remoteVideo.current) {
      remoteVideo.current.srcObject =
        null;
    }

    setCallStatus("idle");
    setAgentId("");
    setStatusMessage("");
  };

  return (
    <div className="video-call-page">
      <div className="video-call-container">

        <h1 className="page-title">
          የቀጥታ ቪዲዮ ጥሪ
        </h1>

        <div className="status-box">

          {statusMessage ||

            (callStatus ===
            "idle"
              ? "ዝግጁ"
              : callStatus ===
                "waiting"
              ? "ለሰራተኛ በመደወል ላይ..."
              : "ጥሪው ተገናኝቷል")}

        </div>

        <div className="video-grid">

          <div className="video-card">
            <h3>
              የእርስዎ ካሜራ
            </h3>

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="video-box"
            />
          </div>

          <div className="video-card">
            <h3>
              የሰራተኛው ቪዲዮ
            </h3>

            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="video-box"
            />
          </div>

        </div>

        <div className="button-group">

          {callStatus ===
            "idle" && (
            <button
              className="call-btn"
              onClick={
                startCall
              }
            >
              📞 ደውል
            </button>
          )}

          {callStatus !==
            "idle" && (
            <button
              className="end-btn"
              onClick={endCall}
            >
              ❌ ጥሪ ዝጋ
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default VideoCallAccess;