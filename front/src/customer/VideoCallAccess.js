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
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    initializeMedia();

    const user =
      JSON.parse(localStorage.getItem("user")) || {};

    const storedUser = localStorage.getItem("user");

if (!storedUser) {
  alert("Please login first");
  window.location.href = "/login";
  return;
}

const user = JSON.parse(storedUser);

const pensionerId = user.id;

console.log("Pensioner ID:", pensionerId);

setMyId(pensionerId);

    setMyId(pensionerId);

    socket.emit("register-user", {
      userId: pensionerId,
      role: "pensioner",
    });

    console.log(
      "Pensioner Registered:",
      pensionerId
    );

    socket.on(
      "agent-accepted",
      handleEmployeeAccepted
    );

    socket.on(
      "call-ended",
      handleCallEnded
    );

    socket.on(
      "all-agents-busy",
      handleBusyEmployees
    );

    socket.on(
      "call-rejected",
      handleRejected
    );

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

  const handleEmployeeAccepted = (
    data
  ) => {
    console.log(
      "Employee Accepted:",
      data
    );

    setEmployeeId(data.agentId);
    setCallStatus("connected");
    setStatusMessage("");

    if (peerRef.current) {
      peerRef.current.signal(
        data.signal
      );
    }
  };

  const handleCallEnded = () => {
    console.log("Call Ended");

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject =
        null;
    }

    setCallStatus("idle");
    setEmployeeId("");
    setStatusMessage("");
  };

  const handleBusyEmployees = (
    data
  ) => {
    console.log("No Employees Available");

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallStatus("idle");
    setStatusMessage(data.message);
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

    peer.on("signal", (signalData) => {
      console.log(
        "Sending Call Request"
      );

      socket.emit(
        "request-agent-call",
        {
          pensionerId: myId,
          signalData,
        }
      );
    });

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

    peer.on("error", (err) => {
      console.error(
        "Peer Error:",
        err
      );
    });

    peerRef.current = peer;
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
      remoteVideo.current.srcObject =
        null;
    }

    setCallStatus("idle");
    setEmployeeId("");
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
            (callStatus === "idle"
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
              onClick={startCall}
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