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


const iceConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ]
};

    const peer = new Peer({
  initiator: true,
  trickle: false,
  stream: streamRef.current,
  config: iceConfig // ይህንን መስመር ጨምሩ
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

<div className="min-h-screen flex justify-center items-center bg-gray-900 p-4 font-sans">
  <div className="w-full max-w-lg bg-gray-800 p-5 rounded-3xl shadow-2xl text-white">
    <h1 className="text-xl font-bold text-center mb-5">የቀጥታ ቪዲዮ ጥሪ</h1>
    
    {/* የቪዲዮ ቦታ */}
    <div className="relative w-full h-[350px] bg-black rounded-2xl overflow-hidden mb-5">
      <video ref={remoteVideo} className="w-full h-full object-cover" autoPlay playsInline />
      <div className="absolute bottom-5 right-5 w-24 h-32 border-4 border-white rounded-xl overflow-hidden z-10 shadow-lg">
        <video ref={myVideo} className="w-full h-full object-cover" autoPlay muted playsInline />
      </div>
    </div>

    {/* የጥሪ ቁልፎች */}
    <div className="flex justify-center gap-4 flex-wrap">
      {callStatus === "idle" ? (
        <button className="bg-green-600 px-8 py-3 rounded-xl font-bold text-lg" onClick={startCall}>📞 ደውል</button>
      ) : (
        <button className="bg-red-600 px-8 py-3 rounded-xl font-bold text-lg" onClick={endCall}>❌ ጥሪ ዝጋ</button>
      )}
      <button className="bg-gray-700 px-5 py-3 rounded-xl" onClick={toggleCamera}>📷 ካሜራ</button>
      <button className="bg-gray-700 px-5 py-3 rounded-xl" onClick={toggleMic}>🎤 ድምፅ</button>
    </div>

    {/* የጥሪ ጊዜ */}
    <div className="text-center mt-4 text-gray-400">⏱️ የጥሪ ጊዜ: {Math.floor(callTime / 60)}:{String(callTime % 60).padStart(2, "0")}</div>
  </div>
</div>
  );

};

export default VideoCallAccess; 
