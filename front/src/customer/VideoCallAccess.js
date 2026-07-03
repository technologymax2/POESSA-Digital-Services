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

const API =
  process.env.REACT_APP_BACKEND_URL ||
  "https://poessa-digital-services-1.onrender.com";

const socket = io(API, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

const VideoCallAccess = () => {

  const navigate = useNavigate();

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);

  const peerRef = useRef(null);

  const timeoutRef = useRef(null);

  const heartbeatRef = useRef(null);

  const [stream, setStream] = useState(null);

  const [callStatus, setCallStatus] =
    useState("idle");

  const [statusMessage, setStatusMessage] =
    useState("");

  const [myId, setMyId] =
    useState("");

  const [employeeId, setEmployeeId] =
    useState("");

  /* ==========================
      CAMERA INITIALIZATION
  ========================== */

  const initializeMedia =
    useCallback(async () => {

      try {

        const media =
          await navigator.mediaDevices.getUserMedia({

            video: {
              width:
                              height: { ideal: 720 },
              facingMode: "user",
            },

            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },

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

  /* ==========================
      SOCKET INITIALIZATION
  ========================== */

  useEffect(() => {

    initializeMedia();

    socket.on("connect", () => {

      console.log("Socket Connected:", socket.id);

    });

    socket.on("disconnect", () => {

      console.log("Socket Disconnected");

    });

    socket.on("reconnect", () => {

      console.log("Socket Reconnected");

      if (myId) {

        socket.emit("register-user", {

          userId: myId,

          role: "pensioner",

        });

      }

    });

    return () => {

      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect");

    };

  }, [initializeMedia, myId]);

  /* ==========================
      HEARTBEAT
  ========================== */

  useEffect(() => {

    if (!myId) return;

    heartbeatRef.current = setInterval(() => {

      socket.emit("heartbeat", {

        userId: myId,

      });

    }, 15000);

    return () => {

      if (heartbeatRef.current) {

        clearInterval(heartbeatRef.current);

      }

    };

  }, [myId]);

  /* ==========================
      SOCKET EVENTS
  ========================== */

  const handleEmployeeAccepted =
    useCallback((data) => {

      console.log("Employee Accepted", data);

      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);

      }

      setEmployeeId(data.agentId);

      setCallStatus("connected");

      setStatusMessage("");

      if (peerRef.current) {

        peerRef.current.signal(data.signal);

      }

    }, []);

  const handleCallEnded =
    useCallback(() => {

      console.log("Call Ended");

      if (peerRef.current) {

        peerRef.current.destroy();

        peerRef.current = null;

      }

      if (remoteVideo.current) {

        remoteVideo.current.srcObject = null;

      }

      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);

      }

      setEmployeeId("");

      setCallStatus("idle");

      setStatusMessage("ጥሪው ተቋርጧል።");

      setTimeout(() => {

        navigate("/");

      }, 5000);

    }, [navigate]);

  const handleRejected =
    useCallback(() => {

      if (peerRef.current) {

        peerRef.current.destroy();

        peerRef.current = null;

      }

      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);

      }

      setEmployeeId("");

      setCallStatus("idle");

      setStatusMessage("ጥሪው ውድቅ ተደርጓል።");

    }, []);

  const handleQueueUpdate =
    useCallback((data) => {

      if (callStatus !== "connected") {

        setStatusMessage(

          `በመጠባበቂያ ውስጥ ነዎት። ከፊትዎ ${data.waiting} ሰው(ዎች) አሉ።`

        );

      }

    }, [callStatus]);
    useEffect(() => {

    socket.on(
      "agent-accepted",
      handleEmployeeAccepted
    );

    socket.on(
      "call-ended",
      handleCallEnded
    );

    socket.on(
      "call-rejected",
      handleRejected
    );

    socket.on(
      "queue-updated",
      handleQueueUpdate
    );

    socket.on(
      "all-agents-busy",
      (data) => {

        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setCallStatus("idle");

        setStatusMessage(
          data.message ||
            "ሁሉም ሰራተኞች በስራ ላይ ናቸው።"
        );

      }
    );

    return () => {

      socket.off(
        "agent-accepted",
        handleEmployeeAccepted
      );

      socket.off(
        "call-ended",
        handleCallEnded
      );

      socket.off(
        "call-rejected",
        handleRejected
      );

      socket.off(
        "queue-updated",
        handleQueueUpdate
      );

      socket.off("all-agents-busy");

    };

  }, [
    handleEmployeeAccepted,
    handleCallEnded,
    handleRejected,
    handleQueueUpdate,
  ]);

  /* ==========================
      START CALL
  ========================== */

  const startCall = (userId) => {

    if (!stream) {

      alert("Camera not ready.");

      return;

    }

    if (callStatus !== "idle") {

      return;

    }

    setCallStatus("waiting");

    setStatusMessage(
      "ለሰራተኛ በመደወል ላይ..."
    );

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

        remoteVideo.current.srcObject =
          remoteStream;

      }

    });

    peer.on("error", (err) => {

      console.error("Peer Error:", err);

    });

    peer.on("close", () => {

      console.log("Peer Closed");

    });

    peerRef.current = peer;

    timeoutRef.current = setTimeout(() => {

      if (
        callStatus !== "connected"
      ) {

        if (peerRef.current) {

          peerRef.current.destroy();

          peerRef.current = null;

        }

        setCallStatus("idle");

        setStatusMessage(
          "30 ሰከንድ ውስጥ ምንም ሰራተኛ አልተገኘም።"
        );

      }

    }, 30000);

  };

  const startCallWithoutTin = () => {

    if (!socket.connected) {

      alert("Server not connected.");

      return;

    }

    const pensionerId = socket.id;

    setMyId(pensionerId);

    socket.emit("register-user", {

      userId: pensionerId,

      role: "pensioner",

    });

    startCall(pensionerId);

  };
    /* ==========================
        UI
  ========================== */

  return (
    <div className="video-call-page">
      <div className="video-call-container">

        <h1 className="page-title">
          የቀጥታ ቪዲዮ ጥሪ
        </h1>

        <div className="status-box">
          {statusMessage ||
            (callStatus === "idle"
              ? "ዝግጁ"
              : callStatus === "waiting"
              ? "ለሰራተኛ በመደወል ላይ..."
              : "ጥሪው ተገናኝቷል")}
        </div>

        <div className="video-layout">

          {/* Employee Video */}
          <div className="remote-video-wrapper">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="remote-video"
            />
          </div>

          {/* Pensioner Video */}
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

        <div className="button-group">

          {callStatus === "idle" ? (

            <button
              className="call-btn"
              onClick={startCallWithoutTin}
            >
              📞 ደውል
            </button>

          ) : (

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
