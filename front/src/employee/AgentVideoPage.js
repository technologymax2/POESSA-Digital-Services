import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import { useNavigate } from "react-router-dom";
import Peer from "simple-peer";
import io from "socket.io-client";

import "./VideoCallAccess.css";

const socket = io(
  process.env.REACT_APP_BACKEND_URL ||
    "https://poessa-digital-services-1.onrender.com",
  {
    transports: ["websocket", "polling"],
    reconnection: true,
  }
);

const VideoCallAccess = () => {
  const navigate = useNavigate();

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const timeoutRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [myId, setMyId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  /* ================= CAMERA ================= */
  const initializeMedia = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(media);

      if (myVideo.current) {
        myVideo.current.srcObject = media;
      }
    } catch (err) {
      console.error(err);
      alert("Camera / Microphone access denied.");
    }
  }, []);

  /* ================= SOCKET EVENTS ================= */
  const handleEmployeeAccepted = useCallback((data) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setEmployeeId(data.agentId);
    setCallStatus("connected");
    setStatusMessage("");

    if (peerRef.current) {
      peerRef.current.signal(data.signal);
    }
  }, []);

  const handleCallEnded = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setCallStatus("idle");
    setEmployeeId("");
    setStatusMessage("ጥሪው ተቋርጧል።");

    setTimeout(() => navigate("/"), 5000);
  }, [navigate]);

  const handleBusyEmployees = useCallback((data) => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");
    setStatusMessage(data?.message || "ሁሉም ሰራተኞች በስራ ላይ ናቸው።");
  }, []);

  const handleRejected = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");
    setStatusMessage("ጥሪው ውድቅ ተደርጓል።");
  }, []);

  /* ================= INIT ================= */
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
    };
  }, [
    initializeMedia,
    handleEmployeeAccepted,
    handleCallEnded,
    handleBusyEmployees,
    handleRejected,
  ]);

  /* ================= START CALL ================= */
  const startCall = (userId) => {
    if (!stream) return alert("Camera not ready");
    if (callStatus !== "idle") return;

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

    peerRef.current = peer;

    timeoutRef.current = setTimeout(() => {
      if (callStatus === "waiting" && !employeeId) {
        peer.destroy();
        peerRef.current = null;

        setCallStatus("idle");
        setStatusMessage("ምንም ነፃ ሰራተኛ አልተገኘም።");

        setTimeout(() => navigate("/"), 5000);
      }
    }, 30000);
  };

  /* ================= REGISTER + CALL ================= */
  const startCallWithoutTin = () => {
    if (!socket.id) return alert("Server not connected");

    const userId = socket.id;

    setMyId(userId);

    socket.emit("register-user", {
      userId,
      role: "pensioner",
    });

    startCall(userId);
  };

  /* ================= END CALL ================= */
  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    socket.emit("end-call", {
      pensionerId: myId,
      agentId: employeeId,
    });

    socket.emit("cancel-call", {
      pensionerId: myId,
    });

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    setCallStatus("idle");
    setEmployeeId("");
    setStatusMessage("ጥሪው ተቋርጧል።");

    setTimeout(() => navigate("/"), 5000);
  };

  /* ================= UI ================= */
  return (
    <div className="video-call-page">
      <div className="video-call-container">
        <h1>የቀጥታ ቪዲዮ ጥሪ</h1>

        <div className="status-box">
          {statusMessage ||
            (callStatus === "idle"
              ? "ዝግጁ"
              : callStatus === "waiting"
              ? "በመደወል ላይ..."
              : "ጥሪ ተገናኝቷል")}
        </div>

        <div className="video-grid">
          <video ref={myVideo} autoPlay muted playsInline />
          <video ref={remoteVideo} autoPlay playsInline />
        </div>

        <div className="button-group">
          {callStatus === "idle" ? (
            <button onClick={startCallWithoutTin}>📞 ደውል</button>
          ) : (
            <button onClick={endCall}>❌ ጥሪ ዝጋ</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallAccess;
