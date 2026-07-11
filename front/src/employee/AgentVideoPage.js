import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import Peer from "simple-peer";
import io from "socket.io-client";
import axios from "axios";

import "./AgentVideoPage.css";

const API =
  process.env.REACT_APP_BACKEND_URL ||
  "https://poessa-digital-services-1.onrender.com";

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
  const [stream, setStream] = useState(null);
  const [employeeId, setEmployeeId] = useState("agent_default_01"); // ነባሪ ID ተሰጥቷል
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
      setStream(media);
      if (myVideo.current) {
        myVideo.current.srcObject = media;
      }
    } catch (error) {
      console.error("Camera Error:", error);
      alert("Camera / Microphone access denied");
    }
  }, []);

  /* Register Agent (Login check removed) */
  useEffect(() => {
    initCamera();

    // ሎጊን ፍተሻ ተወግዷል፣ በቀጥታ ይመዘገባል
    socket.emit("register-user", {
      userId: employeeId,
      role: "employee",
    });

    socket.on("connect", () => {
      console.log("Agent socket connected", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [initCamera, employeeId]);

  /* Handle Socket Events */
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCalls((prev) => {
        const exists = prev.find((c) => c.pensionerId === data.pensionerId);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
      setCallConnected(false);
      setActiveCall(null);
      setCallTime(0);
    });

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-ended");
    };
  }, []);

  /* Call Functions */
  const answerCall = (callData) => {
    if (!streamRef.current) return alert("Camera not ready");
    setActiveCall(callData);
    setCallConnected(true);

    
const iceConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    },
    {
      // ለጊዜው 500mg
      urls: 'turn:global.relay.metered.ca:80', 
      username: '766dd2f336f70eea0ec7cd66',
      credential: 'ZAggeZx3LEb0xHc4'
    }
  ]
};


    const peer = new Peer({ 
  initiator: false, 
  trickle: false, 
  stream: streamRef.current,
  config: iceConfig // ይህንን መስመር ጨምሩ
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

  const rejectCall = (callData) => {
    socket.emit("reject-call", { pensionerId: callData.pensionerId });
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

  const searchPensioner = async () => {
    if (!search.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/video/pensioner/${search}`);
      setPensioner(res.data.data);
    } catch (error) {
      console.error(error);
      alert("Pensioner not found");
      setPensioner(null);
    } finally {
      setLoading(false);
    }
  };

  const captureEvidence = () => {
    if (!remoteVideo.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = remoteVideo.current.videoWidth;
    canvas.height = remoteVideo.current.videoHeight;
    canvas.getContext("2d").drawImage(remoteVideo.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");
    socket.emit("captureEvidence", { pensionerId: activeCall?.pensionerId, image });
    alert("Evidence captured");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const data = { sender: "Agent", message, time: new Date().toLocaleTimeString() };
    socket.emit("chat-message", data);
    setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  /* Timer Effect */
  useEffect(() => {
    let timer;
    if (callConnected) {
      timer = setInterval(() => setCallTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callConnected]);

  return (
   <div className="flex flex-col md:flex-row h-screen p-4 gap-4 bg-gray-100">
  {/* የጥሪዎች ዝርዝር */}
  <div className="w-full md:w-80 bg-white p-4 rounded-xl shadow-lg overflow-y-auto max-h-[40vh] md:max-h-full">
    <h2 className="text-xl font-bold mb-4 border-b pb-2">Incoming Calls</h2>
    {incomingCalls.map((call) => (
      <div key={call.pensionerId} className="bg-gray-50 border p-3 rounded-lg mb-3 flex flex-col gap-2">
        <p className="font-semibold text-sm truncate">{call.pensionerName || call.pensionerId}</p>
        <div className="flex gap-2">
          <button className="flex-1 bg-green-500 text-white py-1 rounded text-xs font-bold" onClick={() => answerCall(call)}>Accept</button>
          <button className="flex-1 bg-red-500 text-white py-1 rounded text-xs font-bold" onClick={() => rejectCall(call)}>Reject</button>
        </div>
      </div>
    ))}
    
    <div className="mt-6 pt-4 border-t">
      <h3 className="font-bold mb-2">Search Pensioner</h3>
      <input className="w-full p-2 border rounded text-sm mb-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Fayda / ID" />
      <button className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold" onClick={searchPensioner}>Search</button>
    </div>
  </div>

  {/* የቪዲዮ ማሳያ */}
  <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-2xl">
    <video ref={remoteVideo} className="w-full h-full object-cover" autoPlay playsInline />
    
    {/* የሰራተኛው ቪዲዮ (Overlay) */}
    <video ref={myVideo} className="absolute bottom-24 right-5 w-28 h-40 border-4 border-white rounded-lg z-10 object-cover shadow-lg" autoPlay muted playsInline />

    {/* የቁጥጥር ቁልፎች */}
    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-3 px-2 flex-wrap z-20">
      <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm" onClick={toggleCamera}>{cameraOn ? "📷 ካሜራ አጥፋ" : "📷 ካሜራ አብራ"}</button>
      <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm" onClick={toggleMic}>{micOn ? "🎤 ድምፅ አጥፋ" : "🎤 ድምፅ አብራ"}</button>
      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm" onClick={captureEvidence}>📷 ፎቶ አንሳ</button>
      {callConnected && <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm" onClick={endCall}>❌ ዝጋ</button>}
    </div>
  </div>
</div>
  );
};

export default AgentVideoPage;
