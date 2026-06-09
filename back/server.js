const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/*
=================================================
Connected Users
=================================================
*/

const users = new Map();

/*
=================================================
Register User
=================================================
*/

io.on("connection", (socket) => {
  console.log(
    "Connected:",
    socket.id
  );

  socket.on(
    "register-user",
    (data) => {

      users.set(
        data.userId,
        {
          socketId:
            socket.id,
          role:
            data.role
        }
      );

      console.log(
        `${data.role} Registered`,
        data.userId
      );

    }
  );

  /*
  ==========================================
  Pensioner Calling Agent
  ==========================================
  */

  socket.on(
    "request-agent-call",
    (data) => {

      const agents =
        Array.from(
          users.entries()
        ).filter(
          ([, user]) =>
            user.role ===
            "agent"
        );

      if (
        agents.length === 0
      ) {

        socket.emit(
          "no-agent-online",
          {
            message:
              "No agent online"
          }
        );

        return;
      }

      agents.forEach(
        ([agentId, agent]) => {

          io.to(
            agent.socketId
          ).emit(
            "incoming-call",
            {
              pensionerId:
                data.pensionerId,

              signalData:
                data.signalData,

              agentId
            }
          );

        }
      );

    }
  );

  /*
  ==========================================
  Agent Answers
  ==========================================
  */

  socket.on(
    "answer-call",
    (data) => {

      const pensioner =
        users.get(
          data.pensionerId
        );

      if (
        pensioner
      ) {

        io.to(
          pensioner.socketId
        ).emit(
          "agent-accepted",
          {
            signal:
              data.signal,

            agentId:
              data.agentId
          }
        );

      }

    }
  );

  /*
  ==========================================
  Reject Call
  ==========================================
  */

  socket.on(
    "reject-call",
    (data) => {

      const pensioner =
        users.get(
          data.pensionerId
        );

      if (
        pensioner
      ) {

        io.to(
          pensioner.socketId
        ).emit(
          "call-rejected"
        );

      }

    }
  );

  /*
  ==========================================
  End Call
  ==========================================
  */

  socket.on(
    "end-call",
    (data) => {

      const pensioner =
        users.get(
          data.pensionerId
        );

      if (
        pensioner
      ) {

        io.to(
          pensioner.socketId
        ).emit(
          "call-ended"
        );

      }

    }
  );

  /*
  ==========================================
  Disconnect
  ==========================================
  */

  socket.on(
    "disconnect",
    () => {

      for (
        const [
          userId,
          user
        ] of users
      ) {

        if (
          user.socketId ===
          socket.id
        ) {

          users.delete(
            userId
          );

          break;
        }

      }

      console.log(
        "Disconnected",
        socket.id
      );

    }
  );

});

server.listen(
  5000,
  () => {

    console.log(
      "Server Running On Port 5000"
    );

  }
);