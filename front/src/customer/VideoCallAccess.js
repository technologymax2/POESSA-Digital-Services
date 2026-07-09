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



  /*
    ==========================
       SOCKET CONNECTION
    ==========================
  */


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


    /*
       Employee accepted call
    */

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



    /*
       Call rejected
    */

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



    /*
       Call ended from server
    */

    socket.on(
      "call-ended",
      ()=>{

        setStatusMessage(
          "ጥሪው ተቋርጧል"
        );


        destroyPeer();

      }
    );



    /*
       Queue update
    */

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



    /*
       Chat messages
    */

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



  /*
    ==========================
        TIMER
    ==========================
  */


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
  /*
    ==========================
       DESTROY PEER
    ==========================
  */

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




  /*
    ==========================
        START CALL
    ==========================
  */


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



    /*
       Send WebRTC signal
    */

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



    /*
       Receive remote video
    */

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





  /*
    ==========================
       CAMERA ON / OFF
    ==========================
  */


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





  /*
    ==========================
       MICROPHONE ON / OFF
    ==========================
  */


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






  /*
    ==========================
          CHAT SEND
    ==========================
  */


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






  /*
    ==========================
          END CALL
    ==========================
  */


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
    /*
    ==========================
             UI
    ==========================
  */


  return (

    <div className="video-call-page">

      <div className="video-call-container">


        <h1 className="page-title">
          የቀጥታ ቪዲዮ ጥሪ
        </h1>



        <div className="status-box">

          {
            statusMessage ||
            (
              callStatus === "idle"
              ? "ዝግጁ"
              :
              callStatus === "waiting"
              ? "ሰራተኛ በመፈለግ ላይ..."
              :
              "ጥሪው ተገናኝቷል"
            )
          }

        </div>




{/* በቪዲዮ ክፍል ውስጥ የሚከተለውን ተጠቀም */}
<div className="video-layout">
  {/* የሰራተኛው ቪዲዮ (ዋና) */}
  <video
    ref={remoteVideo}
    autoPlay
    playsInline
    className="remote-video"
  />

  {/* የራስህ ቪዲዮ (በስተቀኝ ከታች የሚደራረብ) */}
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


          {
            callStatus === "idle"

            ?

            <button

              className="call-btn"

              onClick={startCall}

            >

              📞 ደውል

            </button>


            :


            <button

              className="end-btn"

              onClick={endCall}

            >

              ❌ ጥሪ ዝጋ

            </button>

          }





          <button

            className="control-btn"

            onClick={toggleCamera}

          >

            {
              cameraOn
              ?
              "📷 ካሜራ አጥፋ"
              :
              "📷 ካሜራ አብራ"
            }

          </button>


          <button

            className="control-btn"

            onClick={toggleMic}

          >

            {
              micOn
              ?
              "🎤 ድምፅ አጥፋ"
              :
              "🎤 ድምፅ አብራ"
            }

          </button>



        </div>


        <div className="call-time">


          ⏱️ የጥሪ ጊዜ:

          {" "}

          {Math.floor(callTime / 60)}

          :

          {
            String(callTime % 60)
            .padStart(2,"0")
          }


        </div>


        <div className="chat-box">


          <h2>
            መልዕክት
          </h2>

          <div className="messages">


            {
              messages.map(
                (msg,index)=>(

                  <div
                    key={index}
                    className="message"
                  >

                    <b>
                      {msg.sender}
                    </b>

                    :

                    {" "}

                    {msg.message}


                  </div>

                )
              )

            }


          </div>


          <div className="chat-input">


            <input

              value={message}

              onChange={
                e=>setMessage(e.target.value)
              }

              placeholder="መልዕክት ጻፍ..."

            />



            <button

              onClick={sendMessage}

            >

              ላክ

            </button>



          </div>


        </div>

      </div>


    </div>

  );

};

export default VideoCallAccess;
