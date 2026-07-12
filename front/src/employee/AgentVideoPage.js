import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./AgentVideoPage.css";

const API = process.env.REACT_APP_BACKEND_URL || "https://poessa-digital-services-1.onrender.com";
const socket = io(API, { transports: ["websocket", "polling"] });

const AgentVideoPage = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callConnected, setCallConnected] = useState(false);

  const initCamera = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = media;
      if (myVideo.current) myVideo.current.srcObject = media;
    } catch (error) {
      alert("ካሜራ ወይም ማይክሮፎን መክፈት አልተቻለም");
    }
  }, []);

  useEffect(() => {
    initCamera();
    socket.emit("register-user", { userId: "agent_01", role: "employee" });

    socket.on("incoming-call", (data) => {
      setIncomingCalls((prev) => [...prev, data]);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (peerRef.current) peerRef.current.addIceCandidate(candidate);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("ice-candidate");
    };
  }, [initCamera]);

  const answerCall = (callData) => {
    setActiveCall(callData);
    setCallConnected(true);

    const iceConfig = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '***', credential: '***' }
      ]
    };

    const peer = new Peer({ initiator: false, trickle: false, stream: streamRef.current, config: iceConfig });

    peer.on("signal", (signal) => {
      socket.emit("answer-call", { signal, pensionerId: callData.pensionerId, agentId: "agent_01" });
    });

    peer.on("ice", (candidate) => {
      socket.emit("ice-candidate", { candidate, to: callData.pensionerId });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    });

    peer.signal(callData.signalData);
    peerRef.current = peer;
    setIncomingCalls((prev) => prev.filter((c) => c.pensionerId !== callData.pensionerId));
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4">የሚመጡ ጥሪዎች</h2>
      {incomingCalls.map((call) => (
        <div key={call.pensionerId} className="bg-white p-4 rounded-lg shadow mb-2">
          <p>ፋይዳ ቁጥር: {call.pensionerId}</p>
          <button className="bg-green-500 text-white p-2 rounded" onClick={() => answerCall(call)}>ተቀበል</button>
        </div>
      ))}
      <div className="relative mt-6 w-full h-[400px] bg-black rounded-2xl overflow-hidden">
        <video ref={remoteVideo} className="w-full h-full object-cover" autoPlay playsInline />
        <video ref={myVideo} className="absolute bottom-5 right-5 w-24 h-32 rounded-lg" autoPlay muted playsInline />
      </div>
    </div>
  );
};

export default AgentVideoPage;
