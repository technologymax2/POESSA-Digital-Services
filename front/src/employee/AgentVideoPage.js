import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import axios from "axios";
import "./AgentVideoPage.css";

const API = process.env.REACT_APP_BACKEND_URL || "https://poessa-digital-services-1.onrender.com";

const socket = io(API, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

const AgentVideoPage = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const [employeeId] = useState("agent_default_01");
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callConnected, setCallConnected] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [pensioner, setPensioner] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* Initialize Camera */
  const initCamera = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = media;
      if (myVideo.current) {
        myVideo.current.srcObject = media;
      }
    } catch (error) {
      console.error("Camera Error:", error);
      alert("ካሜራ ወይም ማይክሮፎን መክፈት አልተቻለም");
    }
  }, []);

  useEffect(() => {
    initCamera();
    socket.emit("register-user", { userId: employeeId, role: "employee" });
    
    socket.on("incoming-call", (data) => {
      setIncomingCalls((prev) => {
        const exists = prev.find((c) => c.pensionerId === data.pensionerId);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    socket.on("call-ended", () => {
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
      setCallConnected(false);
      setActiveCall(null);
      setCallTime(0);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");
    };
  }, [initCamera, employeeId]);

  /* Answer Call with STUN Server Configuration */
  const answerCall = (callData) => {
    if (!streamRef.current) return alert("ካሜራ ዝግጁ አይደለም");
    setActiveCall(callData);
    setCallConnected(true);

    const peer = new Peer({ 
      initiator: false, 
      trickle: false, 
      stream: streamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on("signal", (signal) => {
      socket.emit("answer-call", { signal, pensionerId: callData.pensionerId, agentId: employeeId });
    });
    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    });
    
    peer.signal(callData.signalData);
    peerRef.current = peer;
    setIncomingCalls((prev) => prev.filter((c) => c.pensionerId !== callData.pensionerId));
  };

  const endCall = () => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    socket.emit("end-call", { pensionerId: activeCall?.pensionerId });
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setActiveCall(null);
    setCallConnected(false);
    setCallTime(0);
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setCameraOn(videoTrack.enabled); }
  };

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setMicOn(audioTrack.enabled); }
  };

  const captureEvidence = () => {
    if (!remoteVideo.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = remoteVideo.current.videoWidth;
    canvas.height = remoteVideo.current.videoHeight;
    canvas.getContext("2d").drawImage(remoteVideo.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");
    socket.emit("captureEvidence", { pensionerId: activeCall?.pensionerId, image });
    alert("ማረጋገጫ ተያዘ");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const data = { sender: "Agent", message, time: new Date().toLocaleTimeString() };
    socket.emit("chat-message", data);
    setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  useEffect(() => {
    let timer;
    if (callConnected) {
      timer = setInterval(() => setCallTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callConnected]);

  return (
    <div className="agent-page">
      <div className="queue-panel">
        <h2>የሚመጡ ጥሪዎች</h2>
        {incomingCalls.map((call) => (
          <div key={call.pensionerId} className="call-card">
            <p>{call.pensionerId}</p>
            <button onClick={() => answerCall(call)}>ተቀበል</button>
            <button onClick={() => setIncomingCalls(prev => prev.filter(c => c.pensionerId !== call.pensionerId))}>ውድቅ አድርግ</button>
          </div>
        ))}
      </div>

      <div className="video-section">
        <video ref={remoteVideo} autoPlay playsInline className="remote-video" />
        <video ref={myVideo} autoPlay muted playsInline className="local-video" />
        
        <div className="controls">
          <button onClick={toggleCamera}>{cameraOn ? "ካሜራ አጥፋ" : "ካሜራ አብራ"}</button>
          <button onClick={toggleMic}>{micOn ? "ድምፅ አጥፋ" : "ድምፅ አብራ"}</button>
          <button onClick={captureEvidence}>ማረጋገጫ ያዝ</button>
          {callConnected && <button onClick={endCall}>ጥሪ ዝጋ</button>}
        </div>
        
        <div>⏱️ {Math.floor(callTime / 60)}:{String(callTime % 60).padStart(2, "0")}</div>
        
        <div className="chat">
          {messages.map((msg, index) => (
            <p key={index}><b>{msg.sender}</b>: {msg.message}</p>
          ))}
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="መልዕክት..." />
          <button onClick={sendMessage}>ላክ</button>
        </div>
      </div>
    </div>
  );
};

export default AgentVideoPage;
