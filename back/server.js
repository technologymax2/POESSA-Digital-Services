const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("POESSA Video Call Server Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = new Map();

/*
userId -> {
 socketId,
 role
}
*/

const activeCalls = new Map();

/*
pensionerId -> {
 pensionerId,
 agentId
}
*/

const busyAgents = new Set();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("register-user", (data) => {
    users.set(data.userId, {
      socketId: socket.id,
      role: data.role,
    });

    console.log(
      `${data.role} Registered`,
      data.userId
    );
  });

  /*
  =========================================
  REQUEST CALL
  =========================================
  */

  socket.on(
    "request-agent-call",
    (data) => {
      const availableAgents =
        Array.from(
          users.entries()
        ).filter(
          ([agentId, user]) =>
            user.role === "agent" &&
            !busyAgents.has(
              agentId
            )
        );

      if (
        availableAgents.length === 0
      ) {
        socket.emit(
          "all-agents-busy",
          {
            message:
              "ሁሉም ሰራተኞች በሥራ ላይ ናቸው። እባክዎ ቆይተው እንደገና ይደውሉ።",
          }
        );

        return;
      }

      availableAgents.forEach(
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

              agentId,
            }
          );
        }
      );
    }
  );

  /*
  =========================================
  ANSWER CALL
  =========================================
  */

  socket.on(
    "answer-call",
    (data) => {
      if (
        busyAgents.has(
          data.agentId
        )
      ) {
        return;
      }

      busyAgents.add(
        data.agentId
      );

      activeCalls.set(
        data.pensionerId,
        {
          pensionerId:
            data.pensionerId,

          agentId:
            data.agentId,
        }
      );

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
              data.agentId,
          }
        );
      }
    }
  );

  /*
  =========================================
  REJECT CALL
  =========================================
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
  =========================================
  END CALL
  =========================================
  */

  socket.on(
    "end-call",
    (data) => {
      const call =
        activeCalls.get(
          data.pensionerId
        );

      if (!call) return;

      const pensioner =
        users.get(
          call.pensionerId
        );

      const agent =
        users.get(
          call.agentId
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

      if (
        agent
      ) {
        io.to(
          agent.socketId
        ).emit(
          "call-ended"
        );
      }

      busyAgents.delete(
        call.agentId
      );

      activeCalls.delete(
        call.pensionerId
      );

      console.log(
        "Call Ended:",
        call.pensionerId
      );
    }
  );

  /*
  =========================================
  DISCONNECT
  =========================================
  */

  socket.on(
    "disconnect",
    () => {
      let disconnectedUser =
        null;

      for (const [
        userId,
        user,
      ] of users) {
        if (
          user.socketId ===
          socket.id
        ) {
          disconnectedUser =
            userId;

          users.delete(
            userId
          );

          break;
        }
      }

      if (
        disconnectedUser
      ) {
        for (const [
          pensionerId,
          call,
        ] of activeCalls) {
          if (
            call.pensionerId ===
              disconnectedUser ||
            call.agentId ===
              disconnectedUser
          ) {
            const pensioner =
              users.get(
                call.pensionerId
              );

            const agent =
              users.get(
                call.agentId
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

            if (
              agent
            ) {
              io.to(
                agent.socketId
              ).emit(
                "call-ended"
              );
            }

            busyAgents.delete(
              call.agentId
            );

            activeCalls.delete(
              pensionerId
            );
          }
        }
      }

      console.log(
        "Disconnected:",
        socket.id
      );
    }
  );
});

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {
    console.log(
      `Server Running On Port ${PORT}`
    );
  }
);