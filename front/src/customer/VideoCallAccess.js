import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    initializeMedia();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("agent-accepted", handleEmployeeAccepted);
    socket.on("call-ended", handleCallEnded);
    socket.on("all-agents-busy", handleBusyEmployees);
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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

  const handleEmployeeAccepted = (data) => {
    console.log("Employee Accepted:", data);

    setEmployeeId(data.agentId);
    setCallStatus("connected");
    setStatusMessage("");

    if (peerRef.current) {
      peerRef.current.signal(data.signal);
    }
  };

const handleCallEnded = () => {
  console.log("Call Ended");

  if (peerRef.current) {
    peerRef.current.destroy();
    peerRef.current = null;
  }

  if (remoteVideo.current) {
    remoteVideo.current.srcObject = null;
  }

  setCallStatus("idle");
  setEmployeeId("");

  setStatusMessage(
    "ጥሪዉ ተቋርቷል። ከ10 ሰከንዶች በኋላ ወደ ዋና ማውጫ ይመለሳሉ..."
  );

  setTimeout(() => {
    navigate("/");
  }, 10000);
};

  const handleBusyEmployees = (data) => {
    console.log("No Employees Available");

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");
    setStatusMessage(data.message || "No employees available.");
  };

  const handleRejected = () => {
    console.log("Call Rejected");

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");

    alert("ጥሪዎ ውድቅ ተደርጓል");
  };

  const startCall = (userId) => {
    if (!stream) {
      alert("Camera not ready");
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

    peer.on("signal", (signalData) => {
      socket.emit("request-agent-call", {
        pensionerId: userId,
        signalData,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer Error:", err);
    });

    peerRef.current = peer;
  };

  const startCallWithoutTin = () => {
    if (!socket.id) {
      alert("Server connection not ready");
      return;
    }

    const userId = socket.id;

    setMyId(userId);

    socket.emit("register-user", {
      userId,
      role: "pensioner",
    });

    console.log("User Registered:", userId);

    startCall(userId);
  };

const endCall = () => {
  if (peerRef.current) {
    peerRef.current.destroy();
    peerRef.current = null;
  }

  socket.emit("end-call", {
    pensionerId: myId,
    agentId: employeeId,
  });

  if (remoteVideo.current) {
    remoteVideo.current.srcObject = null;
  }

  setCallStatus("idle");
  setEmployeeId("");

  setStatusMessage(
    "ጥሪዉ ተቋርቷል። ከ10 ሰከንዶች በኋላ ወደ ዋና ማውጫ ይመለሳሉ..."
  );

  setTimeout(() => {
    navigate("/");
  }, 10000);
};

  return (
    <div className="video-call-page">
      <div className="video-call-container">
        <h1 className="page-title">የቀጥታ ቪዲዮ ጥሪ</h1>

        <div className="status-box">
          {statusMessage ||
            (callStatus === "idle"
              ? "ዝግጁ"
              : callStatus === "waiting"
              ? "ለሰራተኛ በመደወል ላይ..."
              : "ጥሪው ተገናኝቷል")}
        </div>

        <div className="video-grid">
          <div className="video-card">
            <h3>የእርስዎ ካሜራ</h3>

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="video-box"
            />
          </div>

          <div className="video-card">
            <h3>የሰራተኛው ቪዲዮ</h3>

            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="video-box"
            />
          </div>
        </div>

        <div className="button-group">
          {callStatus === "idle" ? (
            <button className="call-btn" onClick={startCallWithoutTin}>
              📞 ደውል
            </button>
          ) : (
            <button className="end-btn" onClick={endCall}>
              ❌ ጥሪ ዝጋ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallAccess;