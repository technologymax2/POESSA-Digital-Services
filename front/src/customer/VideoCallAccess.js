import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./VideoCallAccess.css";

const API = process.env.REACT_APP_BACKEND_URL || "https://poessa-digital-services-1.onrender.com";
const socket = io(API, { transports: ["websocket", "polling"] });

const VideoCallAccess = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  
  const [faydaNumber, setFaydaNumber] = useState("");
  const [callStatus, setCallStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);

  const initializeMedia = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = media;
      if (myVideo.current) myVideo.current.srcObject = media;
    } catch (error) {
      alert("ካሜራ ወይም ማይክሮፎን መክፈት አልተቻለም");
    }
  }, []);

  useEffect(() => {
    initializeMedia();

    socket.on("agent-accepted", (data) => {
      setCallStatus("connected");
      setStatusMessage("ጥሪው ተገናኝቷል");
      if (peerRef.current) peerRef.current.signal(data.signal);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (peerRef.current) peerRef.current.addIceCandidate(candidate);
    });

    socket.on("call-rejected", () => { setCallStatus("idle"); destroyPeer(); });
    socket.on("call-ended", () => { destroyPeer(); });

    return () => {
      socket.off("agent-accepted");
      socket.off("ice-candidate");
      socket.off("call-rejected");
      socket.off("call-ended");
    };
  }, [initializeMedia]);

  const destroyPeer = () => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setCallStatus("idle");
    setCallTime(0);
  };

  const startCall = () => {
    if (!faydaNumber.trim()) return alert("እባክዎ ፋይዳ ቁጥር ያስገቡ");
    if (!streamRef.current) return initializeMedia();

    socket.emit("register-user", { userId: faydaNumber, role: "pensioner" });

    const iceConfig = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '***', credential: '***' }
      ]
    };

    const peer = new Peer({ initiator: true, trickle: false, stream: streamRef.current, config: iceConfig });

    peer.on("signal", (signalData) => {
      socket.emit("request-agent-call", { pensionerId: faydaNumber, signalData });
    });

    peer.on("ice", (candidate) => {
      socket.emit("ice-candidate", { candidate, to: "agent_01" }); // ሰራተኛው ዘንድ የሚላክ
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
    setCallStatus("waiting");
    setStatusMessage("ለሰራተኛ በመደወል ላይ...");
  };

  const endCall = () => {
    socket.emit("end-call", { pensionerId: faydaNumber });
    destroyPeer();
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900 p-4">
      <div className="w-full max-w-lg bg-gray-800 p-5 rounded-3xl text-white">
        <h1 className="text-xl font-bold text-center mb-5">የቀጥታ ቪዲዮ ጥሪ</h1>
        
        <input 
          className="w-full p-3 mb-4 rounded-xl text-black"
          placeholder="የፋይዳ ቁጥር ያስገቡ"
          value={faydaNumber}
          onChange={(e) => setFaydaNumber(e.target.value)}
        />

        <div className="relative w-full h-[350px] bg-black rounded-2xl overflow-hidden mb-5">
          <video ref={remoteVideo} className="w-full h-full object-cover" autoPlay playsInline />
          <video ref={myVideo} className="absolute bottom-5 right-5 w-24 h-32 rounded-xl" autoPlay muted playsInline />
        </div>

        <div className="flex justify-center gap-4">
          {callStatus === "idle" ? (
            <button className="bg-green-600 px-8 py-3 rounded-xl font-bold" onClick={startCall}>📞 ደውል</button>
          ) : (
            <button className="bg-red-600 px-8 py-3 rounded-xl font-bold" onClick={endCall}>❌ ጥሪ ዝጋ</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallAccess;
