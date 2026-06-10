import io from 'socket.io-client';

const socket = io("http://localhost:5000");

export const initVideoCall = (userId, role, onIncomingCall, onCallAccepted, onCallEnded) => {
  socket.emit("register-user", { userId, role });

  socket.on("incoming-call", (data) => onIncomingCall(data));
  socket.on("agent-accepted", (data) => onCallAccepted(data));
  socket.on("call-ended", () => onCallEnded());

  return {
    requestCall: (pensionerId, signalData) => {
      socket.emit("request-agent-call", { pensionerId, signalData });
    },
    answerCall: (agentId, pensionerId, signal) => {
      socket.emit("answer-call", { agentId, pensionerId, signal });
    },
    endCall: (pensionerId) => {
      socket.emit("end-call", { pensionerId });
    }
  };
};