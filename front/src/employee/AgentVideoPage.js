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
});

const AgentVideoPage = () => {

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callConnected, setCallConnected] = useState(false);

  const [employeeId, setEmployeeId] = useState("");

  const [search, setSearch] = useState("");
  const [pensioner, setPensioner] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= CAMERA ================= */
  const initCamera = useCallback(async () => {
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
      alert("Camera permission denied");
    }
  }, []);

  /* ================= LOGIN ================= */
  useEffect(() => {

    initCamera();

    const stored = localStorage.getItem("user");

    if (!stored) {
      alert("Login required");
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(stored);

    setEmployeeId(user.id);

    socket.emit("register-user", {
      userId: user.id,
      role: "employee",
    });

  }, [initCamera]);

  /* ================= SEARCH PENSIONER ================= */
  const searchPensioner = async () => {
    if (!search.trim()) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${API}/api/video/pensioner/${search}`
      );

      setPensioner(res.data.data);

    } catch (err) {
      console.error(err);
      alert("Not found");
      setPensioner(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleCallEnded);

    socket.on("remove-call", ({ pensionerId }) => {
      setIncomingCalls((prev) =>
        prev.filter((c) => c.pensionerId !== pensionerId)
      );
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");
      socket.off("remove-call");
    };

  }, []);

  const handleIncomingCall = (data) => {
    setIncomingCalls((prev) => {
      const exists = prev.find(
        (c) => c.pensionerId === data.pensionerId
      );
      if (exists) return prev;
      return [...prev, data];
    });
  };

  const handleCallEnded = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    setCallConnected(false);
    setActiveCall(null);
  };

  /* ================= ANSWER CALL ================= */
  const answerCall = (callData) => {

    if (!stream) return;

    setActiveCall(callData);
    setCallConnected(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("answer-call", {
        signal,
        pensionerId: callData.pensionerId,
        agentId: employeeId,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(callData.signalData);

    peerRef.current = peer;

    setIncomingCalls((prev) =>
      prev.filter((c) => c.pensionerId !== callData.pensionerId)
    );
  };

  /* ================= REJECT ================= */
  const rejectCall = (callData) => {
    socket.emit("reject-call", {
      pensionerId: callData.pensionerId,
    });

    setIncomingCalls((prev) =>
      prev.filter((c) => c.pensionerId !== callData.pensionerId)
    );
  };

  /* ================= END CALL ================= */
  const endCall = () => {

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    socket.emit("end-call", {
      pensionerId: activeCall?.pensionerId,
    });

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    setCallConnected(false);
    setActiveCall(null);
  };

  /* ================= UI ================= */
  return (
    <div className="agent-page">

      {/* LEFT */}
      <div className="queue-panel">

        <h2>Incoming Calls</h2>

        {incomingCalls.map((call) => (
          <div key={call.pensionerId} className="call-card">
            <p>{call.pensionerId}</p>

            <button onClick={() => answerCall(call)}>
              Answer
            </button>

            <button onClick={() => rejectCall(call)}>
              Reject
            </button>
          </div>
        ))}

        <hr />

        <h3>Search Pensioner</h3>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={searchPensioner}>
          Search
        </button>

        {loading && <p>Loading...</p>}

        {pensioner && (
          <div className="pensioner-card">
            <p>{pensioner.nameEng}</p>
            <p>{pensioner.pensionerId}</p>
          </div>
        )}

      </div>

      {/* RIGHT */}
      <div className="video-section">

        <video
          ref={remoteVideo}
          autoPlay
          playsInline
        />

        <video
          ref={myVideo}
          autoPlay
          muted
          playsInline
        />

        {callConnected && (
          <button onClick={endCall}>
            End Call
          </button>
        )}

      </div>

    </div>
  );
};

export default AgentVideoPage;
