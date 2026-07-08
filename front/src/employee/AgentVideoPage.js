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

  const timerRef = useRef(null);

  const [stream,setStream] =
    useState(null);

  const [employeeId,setEmployeeId] =
    useState("");
  const [incomingCalls,setIncomingCalls] =
    useState([]);
  const [activeCall,setActiveCall] =
    useState(null);
  const [callConnected,setCallConnected] =
    useState(false);

  const [cameraOn,setCameraOn] =
    useState(true);

  const [micOn,setMicOn] =
    useState(true);

  const [callTime,setCallTime] =
    useState(0);

  const [messages,setMessages] =
    useState([]);

  const [message,setMessage] =
    useState("");

  const [pensioner,setPensioner] =
    useState(null);

  const [search,setSearch] =
    useState("");

  const [loading,setLoading] =
    useState(false);

  /*
    ==========================
        INITIALIZE CAMERA
    ==========================
  */


  const initCamera = useCallback(async () => {

    try {

      const media =
        await navigator.mediaDevices.getUserMedia({

          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },

          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }

        });



      streamRef.current = media;

      setStream(media);



      if(myVideo.current){

        myVideo.current.srcObject =
          media;

      }



    } catch(error){

      console.error(
        "Camera Error:",
        error
      );


      alert(
        "Camera / Microphone access denied"
      );

    }


  }, []);


  useEffect(()=>{
    initCamera();

    const stored =
      localStorage.getItem("user");

    if(!stored){

      alert(
        "Login required"
      );

      window.location.href =
        "/login";

      return;

    }



    const user =
      JSON.parse(stored);



    const id =
      user.id || user._id;



    setEmployeeId(id);



    socket.emit(
      "register-user",
      {
        userId:id,
        role:"employee"
      }
    );



    socket.on(
      "connect",
      ()=>{

        console.log(
          "Agent socket connected",
          socket.id
        );

      }
    );



    return ()=>{

      socket.off(
        "connect"
      );


    };


  },[initCamera]);



  useEffect(()=>{


    const handleIncomingCall =
      (data)=>{


        console.log(
          "Incoming call:",
          data
        );


        setIncomingCalls(
          prev=>{

            const exists =
              prev.find(
                c =>
                c.pensionerId === data.pensionerId
              );


            if(exists)
              return prev;

            return [
              ...prev,
              data
            ];

          }
        );


      };

    socket.on(
      "incoming-call",
      handleIncomingCall
    );


    socket.on(
      "call-ended",
      ()=>{

        if(peerRef.current){

          peerRef.current.destroy();

          peerRef.current=null;

        }

        if(remoteVideo.current){

          remoteVideo.current.srcObject=null;

        }

        setCallConnected(false);

        setActiveCall(null);

        setCallTime(0);

      }
    );

    return ()=>{
      socket.off(
        "incoming-call",
        handleIncomingCall
      );
      socket.off(
        "call-ended"
      );

    };

  },[]);
  
  /*
    ==========================
        ANSWER CALL
    ==========================
  */


  const answerCall = (callData) => {


    if(!streamRef.current){

      alert(
        "Camera not ready"
      );

      return;

    }



    setActiveCall(
      callData
    );


    setCallConnected(
      true
    );



    const peer =
      new Peer({

        initiator:false,

        trickle:false,

        stream:
          streamRef.current

      });


    peer.on(
      "signal",
      (signal)=>{


        socket.emit(
          "answer-call",
          {

            signal,

            pensionerId:
              callData.pensionerId,


            agentId:
              employeeId

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
          "Peer error:",
          error
        );

      }
    );


    peer.signal(
      callData.signalData
    );



    peerRef.current =
      peer;


    setIncomingCalls(
      prev =>
      prev.filter(
        c =>
        c.pensionerId !== callData.pensionerId
      )
    );


  };



  const rejectCall = (callData)=>{


    socket.emit(
      "reject-call",
      {

        pensionerId:
          callData.pensionerId

      }
    );



    setIncomingCalls(
      prev =>
      prev.filter(
        c =>
        c.pensionerId !== callData.pensionerId
      )
    );


  };



  const endCall = ()=>{


    if(peerRef.current){

      peerRef.current.destroy();

      peerRef.current=null;

    }

    socket.emit(
      "end-call",
      {

        pensionerId:
          activeCall?.pensionerId

      }
    );

    if(remoteVideo.current){

      remoteVideo.current.srcObject=null;

    }

    setActiveCall(null);

    setCallConnected(false);

    setCallTime(0);


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



  useEffect(()=>{


    let timer;


    if(callConnected){

      timer =
        setInterval(()=>{

          setCallTime(
            prev=>prev + 1
          );

        },1000);

    }


    return ()=>{

      if(timer){

        clearInterval(timer);

      }

    };


  },[
    callConnected
  ]);



  const searchPensioner = async ()=>{


    if(!search.trim())
      return;



    try{


      setLoading(true);



      const res =
        await axios.get(
          `${API}/api/video/pensioner/${search}`
        );



      setPensioner(
        res.data.data
      );



    }catch(error){


      console.error(error);


      alert(
        "Pensioner not found"
      );


      setPensioner(null);


    }
    finally{


      setLoading(false);


    }


  };


  const captureEvidence = ()=>{


    if(!remoteVideo.current)
      return;



    const canvas =
      document.createElement(
        "canvas"
      );



    canvas.width =
      remoteVideo.current.videoWidth;


    canvas.height =
      remoteVideo.current.videoHeight;



    const ctx =
      canvas.getContext(
        "2d"
      );



    ctx.drawImage(
      remoteVideo.current,
      0,
      0,
      canvas.width,
      canvas.height
    );



    const image =
      canvas.toDataURL(
        "image/jpeg"
      );



    socket.emit(
      "captureEvidence",
      {

        pensionerId:
          activeCall?.pensionerId,

        image

      }
    );



    alert(
      "Evidence captured"
    );


  };


  const sendMessage = ()=>{


    if(!message.trim())
      return;



    const data = {

      sender:
        "Agent",

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
  
  return (

    <div className="agent-page">


      <div className="queue-panel">


        <h2>
          Incoming Calls
        </h2>



        {
          incomingCalls.map(
            (call)=>(

              <div
                key={call.pensionerId}
                className="call-card"
              >

                <p>
                  {call.pensionerName ||
                  call.pensionerId}
                </p>


                <button
                  onClick={()=>
                    answerCall(call)
                  }
                >
                  Accept
                </button>



                <button
                  onClick={()=>
                    rejectCall(call)
                  }
                >
                  Reject
                </button>


              </div>

            )
          )
        }

        <hr/>

        <h3>
          Search Pensioner
        </h3>


        <input

          value={search}

          onChange={
            e=>setSearch(e.target.value)
          }

          placeholder="Fayda / ID"

        />


        <button
          onClick={searchPensioner}
        >
          Search
        </button>

        {
          pensioner &&

          <div>

            <p>
              {pensioner.nameEng}
            </p>

            <p>
              {pensioner.faydaNumber}
            </p>

          </div>

        }


      </div>

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

        <div>

          <button
            onClick={toggleCamera}
          >

            {
              cameraOn
              ?
              "Camera Off"
              :
              "Camera On"
            }

          </button>



          <button
            onClick={toggleMic}
          >

            {
              micOn
              ?
              "Mute"
              :
              "Unmute"
            }

          </button>
          <button
            onClick={captureEvidence}
          >

            Capture

          </button>

          {
            callConnected &&
            <button
              onClick={endCall}
            >
              End Call
            </button>
          }
        </div>
        <div>

          ⏱️

          {Math.floor(callTime/60)}
          :
          {
            String(callTime%60)
            .padStart(2,"0")
          }

        </div>

        <div className="chat">
          {
            messages.map(
              (msg,index)=>(

                <p key={index}>

                  <b>
                    {msg.sender}
                  </b>
                  :
                  {msg.message}

                </p>

              )
            )

          }

          <input

            value={message}

            onChange={
              e=>setMessage(e.target.value)
            }

            placeholder="Message..."

          />
          <button
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};


export default AgentVideoPage;
