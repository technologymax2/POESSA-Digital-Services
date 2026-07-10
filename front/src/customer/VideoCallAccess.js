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
});


const VideoCallAccess = () => {

  const navigate = useNavigate();


  // Video references
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);


  // WebRTC
  const peerRef = useRef(null);


  // Stream
  const streamRef = useRef(null);


  // Timer
  const timerRef = useRef(null);


  // Timeout
  const timeoutRef = useRef(null);



  const [myId,setMyId] = useState("");

  const [employeeId,setEmployeeId] = useState("");

  const [callStatus,setCallStatus] =
    useState("idle");


  const [statusMessage,setStatusMessage] =
    useState("");


  const [cameraOn,setCameraOn] =
    useState(true);


  const [micOn,setMicOn] =
    useState(true);


  const [callTime,setCallTime] =
    useState(0);



  const [message,setMessage] =
    useState("");


  const [messages,setMessages] =
    useState([]);
  /*
    ==========================
      CAMERA INITIALIZATION
    ==========================
  */

  const initializeMedia = useCallback(async () => {
    try {

      const media =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });


      streamRef.current = media;


      if (myVideo.current) {
        myVideo.current.srcObject = media;
      }


    } catch (error) {

      console.error(
        "Camera Error:",
        error
      );

      alert(
        "ካሜራ ወይም ማይክሮፎን መክፈት አልተቻለም"
      );
    }

  }, []);


  useEffect(() => {

    initializeMedia();


    socket.on(
      "connect",
      () => {
        console.log(
          "Socket Connected:",
          socket.id
        );
      }
    );



    socket.on(
      "agent-accepted",
      (data)=>{

        console.log(
          "Employee accepted",
          data
        );


        setEmployeeId(
          data.agentId
        );


        setCallStatus(
          "connected"
        );


        setStatusMessage(
          "ጥሪው ተገናኝቷል"
        );


        if(peerRef.current){

          peerRef.current.signal(
            data.signal
          );

        }

      }
    );



    socket.on(
      "call-rejected",
      ()=>{

        setCallStatus(
          "idle"
        );


        setStatusMessage(
          "ጥሪው ውድቅ ተደርጓል"
        );


        destroyPeer();

      }
    );



    socket.on(
      "call-ended",
      ()=>{

        setStatusMessage(
          "ጥሪው ተቋርጧል"
        );


        destroyPeer();

      }
    );


    socket.on(
      "queue-updated",
      (data)=>{

        if(
          callStatus !== "connected"
        ){

          setStatusMessage(
            `በመጠባበቂያ ውስጥ ነዎት። 
             ${data.waitingCalls || 0} ሰው ቀድሞዎት አለ`
          );

        }

      }
    );


    socket.on(
      "chat-message",
      (data)=>{

        setMessages(
          prev=>[
            ...prev,
            data
          ]
        );

      }
    );



    return ()=>{

      socket.off(
        "agent-accepted"
      );

      socket.off(
        "call-ended"
      );

      socket.off(
        "call-rejected"
      );

      socket.off(
        "queue-updated"
      );

      socket.off(
        "chat-message"
      );

    };


  },[
    initializeMedia,
    callStatus
  ]);


  useEffect(()=>{

    if(
      callStatus === "connected"
    ){

      timerRef.current =
        setInterval(()=>{

          setCallTime(
            prev=>prev+1
          );

        },1000);

    }


    return ()=>{

      if(timerRef.current){

        clearInterval(
          timerRef.current
        );

      }

    };


  },[
    callStatus
  ]);
 
  const destroyPeer = () => {

    if (peerRef.current) {

      peerRef.current.destroy();

      peerRef.current = null;
    }


    if (remoteVideo.current) {

      remoteVideo.current.srcObject = null;

    }


    setEmployeeId("");

    setCallStatus("idle");

    setCallTime(0);

  };


  const startCall = () => {


    if (!streamRef.current) {

      alert(
        "Camera is not ready"
      );

      return;

    }



    if (
      callStatus !== "idle"
    ) {

      return;

    }



    const pensionerId =
      socket.id;



    setMyId(
      pensionerId
    );


    socket.emit(
      "register-user",
      {
        userId: pensionerId,
        role: "pensioner"
      }
    );



    setCallStatus(
      "waiting"
    );


    setStatusMessage(
      "ለሰራተኛ በመደወል ላይ..."
    );



    const peer =
      new Peer({

        initiator:true,

        trickle:false,

        stream:
          streamRef.current

      });


    peer.on(
      "signal",
      (signalData)=>{


        socket.emit(
          "request-agent-call",
          {

            pensionerId,

            signalData

          }
        );


      }
    );



    peer.on(
      "stream",
      (remoteStream)=>{


        if(remoteVideo.current){

          remoteVideo.current.srcObject =
            remoteStream;

        }


      }
    );



    peer.on(
      "error",
      (error)=>{

        console.error(
          "Peer Error:",
          error
        );

      }
    );



    peerRef.current =
      peer;



  };


  const toggleCamera = ()=>{


    const videoTrack =
      streamRef.current
      ?.getVideoTracks()[0];



    if(videoTrack){


      videoTrack.enabled =
        !videoTrack.enabled;



      setCameraOn(
        videoTrack.enabled
      );


    }


  };




  const toggleMic = ()=>{


    const audioTrack =
      streamRef.current
      ?.getAudioTracks()[0];



    if(audioTrack){


      audioTrack.enabled =
        !audioTrack.enabled;



      setMicOn(
        audioTrack.enabled
      );


    }


  };




  const sendMessage = ()=>{


    if(!message.trim())
      return;



    const data = {

      sender:"Pensioner",

      message,

      time:
        new Date()
        .toLocaleTimeString()

    };



    socket.emit(
      "chat-message",
      data
    );



    setMessages(
      prev=>[
        ...prev,
        data
      ]
    );



    setMessage("");

  };



  const endCall = ()=>{


    socket.emit(
      "end-call",
      {

        pensionerId:
          myId || socket.id

      }
    );



    destroyPeer();



    if(streamRef.current){

      streamRef.current
      .getTracks()
      .forEach(
        track=>track.stop()
      );

    }



    setStatusMessage(
      "ጥሪው ተዘግቷል"
    );


  };
 

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

export default VideoCallAccess;
