import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./VideoCallAccess.css";

const API = process.env.REACT_APP_BACKEND_URL || "https://poessa-digital-services-1.onrender.com";
const socket = io(API, { transports: ["websocket"] });

const VideoCallAccess = () => {
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [callStatus, setCallStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // የካሜራ እና ማይክሮፎን ዝግጅት
  const initializeMedia = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = media;
      if (myVideo.current) myVideo.current.srcObject = media;
    } catch (error) {
      alert("ካሜራ ወይም ማይክሮፎን መጠቀም አልተቻለም");
    }
  }, []);

  useEffect(() => {
    initializeMedia();
    socket.on("agent-accepted", (data) => {
      setCallStatus("connected");
      setStatusMessage("ጥሪው ተገናኝቷል");
      if (peerRef.current) peerRef.current.signal(data.signal);
    });

    socket.on("call-rejected", () => {
      setCallStatus("idle");
      setStatusMessage("ጥሪው ውድቅ ተደርጓል");
      destroyPeer();
    });

    socket.on("call-ended", () => {
      setStatusMessage("ጥሪው ተቋርጧል");
      destroyPeer();
    });

    socket.on("chat-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("agent-accepted");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("chat-message");
    };
  }, [initializeMedia]);

  // የጥሪ ጊዜ መቁጠሪያ
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => setCallTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const destroyPeer = () => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setCallStatus("idle");
    setCallTime(0);
  };

  const startCall = () => {
    if (!streamRef.current) return alert("ካሜራ ዝግጁ አይደለም");
    setCallStatus("waiting");
    setStatusMessage("ለሰራተኛ በመደወል ላይ...");

    // STUN Servers ለኔትወርክ ግንኙነት
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: streamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on("signal", (signalData) => {
      socket.emit("request-agent-call", { pensionerId: socket.id, signalData });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  };

  const endCall = () => {
    socket.emit("end-call", { pensionerId: socket.id });
    destroyPeer();
  };

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraOn(track.enabled); }
  };

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const data = { sender: "Pensioner", message, time: new Date().toLocaleTimeString() };
    socket.emit("chat-message", data);
    setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  return (
    <div className="video-call-page">
      <div className="video-call-container">
        <h1>የቀጥታ ቪዲዮ ጥሪ</h1>
        <div className="status-box">{statusMessage || "ዝግጁ"}</div>
        
        <div className="video-layout">
          <div className="remote-video-wrapper">
            <h3>ሰራተኛ</h3>
            <video ref={remoteVideo} autoPlay playsInline className="remote-video" />
          </div>
          <div className="local-video-wrapper">
            <h3>እርስዎ</h3>
            <video ref={myVideo} autoPlay muted playsInline className="local-video" />
          </div>
        </div>

        <div className="button-group">
          {callStatus === "idle" ? (
            <button className="call-btn" onClick={startCall}>📞 ደውል</button>
          ) : (
            <button className="end-btn" onClick={endCall}>❌ ጥሪ ዝጋ</button>
          )}
          <button className="control-btn" onClick={toggleCamera}>{cameraOn ? "📷 ካሜራ አጥፋ" : "📷 ካሜራ አብራ"}</button>
          <button className="control-btn" onClick={toggleMic}>{micOn ? "🎤 ድምፅ አጥፋ" : "🎤 ድምፅ አብራ"}</button>
        </div>

        <div className="call-time">⏱️ ጊዜ: {Math.floor(callTime / 60)}:{String(callTime % 60).padStart(2, "0")}</div>
        
        <div className="chat-box">
          <div className="messages">
            {messages.map((msg, index) => (
              <p key={index}><b>{msg.sender}:</b> {msg.message}</p>
            ))}
          </div>
          <div className="chat-input">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="መልዕክት..." />
            <button onClick={sendMessage}>ላክ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallAccess;
