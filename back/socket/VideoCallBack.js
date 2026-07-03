const Pensioner = require("../models/UserPensioner.js");

module.exports = (io) => {

  /* =====================================
      MEMORY
  ===================================== */

  const users = new Map();

  const employees = new Map();

  const pensioners = new Map();

  const waitingQueue = [];

  const activeCalls = new Map();

  /* =====================================
      HELPER FUNCTIONS
  ===================================== */

  const getFreeEmployees = () => {

    return [...employees.values()].filter(
      (employee) => employee.status === "free"
    );

  };

  const sendQueueUpdate = () => {

    io.emit("queue-updated", {

      waitingCalls: waitingQueue.length,

      onlineEmployees: employees.size,

      freeEmployees: getFreeEmployees().length,

      activeCalls: activeCalls.size,

    });

  };

  const setEmployeeBusy = (
    employeeId,
    pensionerId
  ) => {

    const employee =
      employees.get(employeeId);

    if (!employee) return;

    employee.status = "busy";

    employee.currentCall =
      pensionerId;

    employees.set(
      employeeId,
      employee
    );

  };

  const setEmployeeFree = (
    employeeId
  ) => {

    const employee =
      employees.get(employeeId);

    if (!employee) return;

    employee.status = "free";

    employee.currentCall = null;

    employees.set(
      employeeId,
      employee
    );

  };

  const removeWaitingCall = (
    pensionerId
  ) => {

    const index =
      waitingQueue.findIndex(

        (item) =>

          item.pensionerId ===
          pensionerId

      );

    if (index !== -1) {

      waitingQueue.splice(index, 1);

    }

  };

  /* =====================================
      SOCKET CONNECTION
  ===================================== */

  io.on("connection", (socket) => {

    console.log(
      "Socket Connected:",
      socket.id
    );
        /* =====================================
        REGISTER USER
    ===================================== */

    socket.on("register-user", async (data) => {

      try {

        const {
          userId,
          role,
          fullName,
        } = data;

        users.set(userId, {
          socketId: socket.id,
          userId,
          role,
        });

        /* ----------------------------
           EMPLOYEE
        ---------------------------- */

        if (role === "employee") {

          employees.set(userId, {
            socketId: socket.id,
            employeeId: userId,
            fullName:
              fullName || "Employee",
            status: "free",
            currentCall: null,
            connectedAt: new Date(),
            lastSeen: Date.now(),
          });

          console.log(
            "Employee Registered:",
            userId
          );

          sendQueueUpdate();

          return;

        }

        /* ----------------------------
           PENSIONER
        ---------------------------- */

        pensioners.set(userId, {
          socketId: socket.id,
          pensionerId: userId,
          status: "waiting",
          connectedAt: new Date(),
          lastSeen: Date.now(),
        });

        console.log(
          "Pensioner Registered:",
          userId
        );

        sendQueueUpdate();

      } catch (err) {

        console.error(err);

      }

    });

    /* =====================================
        REQUEST CALL
    ===================================== */

    socket.on(
      "request-agent-call",
      async ({
        pensionerId,
        signalData,
      }) => {

        try {

          let pensionerName =
            pensionerId;

          try {

            const person =
              await Pensioner.findOne({
                $or: [
                  {
                    pensionerId,
                  },
                  {
                    faydaNumber:
                      pensionerId,
                  },
                ],
              });

            if (person) {

              pensionerName =
                person.nameEng ||
                person.nameAmh ||
                pensionerId;

            }

          } catch (e) {}

          const freeEmployees =
            getFreeEmployees();

          if (
            freeEmployees.length === 0
          ) {

            waitingQueue.push({

              pensionerId,

              pensionerName,

              signalData,

              requestedAt:
                new Date(),

            });

            socket.emit(
              "all-agents-busy",
              {
                message:
                  "All employees are busy. Please wait...",
              }
            );

            sendQueueUpdate();

            return;

          }

          const employee =
            freeEmployees[0];

          io.to(
            employee.socketId
          ).emit(
            "incoming-call",
            {

              pensionerId,

              pensionerName,

              signalData,

            }
          );

          waitingQueue.push({

            pensionerId,

            pensionerName,

            signalData,

            requestedAt:
              new Date(),

          });

          sendQueueUpdate();

        } catch (err) {

          console.error(err);

        }

      }
    );
        /* =====================================
        ANSWER CALL
    ===================================== */

    socket.on(
      "answer-call",
      ({ pensionerId, agentId, signal }) => {

        const employee =
          employees.get(agentId);

        const pensioner =
          pensioners.get(pensionerId);

        if (!employee || !pensioner) {
          return;
        }

        setEmployeeBusy(
          agentId,
          pensionerId
        );

        removeWaitingCall(
          pensionerId
        );

        activeCalls.set(
          pensionerId,
          {
            pensionerId,
            agentId,
            startedAt:
              new Date(),
          }
        );

        io.to(
          pensioner.socketId
        ).emit(
          "agent-accepted",
          {
            agentId,
            signal,
          }
        );

        sendQueueUpdate();

        console.log(
          "Call Connected:",
          pensionerId,
          "->",
          agentId
        );

      }
    );

    /* =====================================
        REJECT CALL
    ===================================== */

    socket.on(
      "reject-call",
      ({ pensionerId }) => {

        const pensioner =
          pensioners.get(
            pensionerId
          );

        if (pensioner) {

          io.to(
            pensioner.socketId
          ).emit(
            "call-rejected"
          );

        }

        removeWaitingCall(
          pensionerId
        );

        io.emit(
          "remove-call",
          {
            pensionerId,
          }
        );

        sendQueueUpdate();

      }
    );

    /* =====================================
        END CALL
    ===================================== */

    socket.on(
      "end-call",
      ({
        pensionerId,
        agentId,
      }) => {

        const call =
          activeCalls.get(
            pensionerId
          );

        if (!call) return;

        const employee =
          employees.get(
            call.agentId
          );

        const pensioner =
          pensioners.get(
            call.pensionerId
          );

        if (employee) {

          io.to(
            employee.socketId
          ).emit(
            "call-ended"
          );

          setEmployeeFree(
            call.agentId
          );

        }

        if (pensioner) {

          io.to(
            pensioner.socketId
          ).emit(
            "call-ended"
          );

        }

        activeCalls.delete(
          pensionerId
        );

        sendQueueUpdate();

        console.log(
          "Call Ended:",
          pensionerId
        );

      }
    );

    /* =====================================
        CANCEL CALL
    ===================================== */

    socket.on(
      "cancel-call",
      ({ pensionerId }) => {

        removeWaitingCall(
          pensionerId
        );

        io.emit(
          "remove-call",
          {
            pensionerId,
          }
        );

        sendQueueUpdate();

      }
    );
        /* =====================================
        ASSIGN WAITING CALLS
    ===================================== */

    const assignWaitingCalls = () => {

      while (
        waitingQueue.length > 0 &&
        getFreeEmployees().length > 0
      ) {

        const call = waitingQueue.shift();

        const employee =
          getFreeEmployees()[0];

        if (!employee) break;

        io.to(employee.socketId).emit(
          "incoming-call",
          {
            pensionerId:
              call.pensionerId,

            pensionerName:
              call.pensionerName,

            signalData:
              call.signalData,
          }
        );

      }

      sendQueueUpdate();

    };

    /* =====================================
        EMPLOYEE READY
    ===================================== */

    socket.on(
      "employee-ready",
      ({ agentId }) => {

        setEmployeeFree(agentId);

        assignWaitingCalls();

      }
    );

    /* =====================================
        HEARTBEAT
    ===================================== */

    socket.on(
      "heartbeat",
      ({ userId }) => {

        const employee =
          employees.get(userId);

        if (employee) {

          employee.lastSeen =
            Date.now();

          employees.set(
            userId,
            employee
          );

        }

        const pensioner =
          pensioners.get(userId);

        if (pensioner) {

          pensioner.lastSeen =
            Date.now();

          pensioners.set(
            userId,
            pensioner
          );

        }

      }
    );

    /* =====================================
        STATUS
    ===================================== */

    socket.on(
      "get-status",
      () => {

        socket.emit(
          "status",
          {

            onlineEmployees:
              employees.size,

            freeEmployees:
              getFreeEmployees().length,

            waitingCalls:
              waitingQueue.length,

            activeCalls:
              activeCalls.size,

          }
        );

      }
    );

    /* =====================================
        DISCONNECT
    ===================================== */

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Disconnected:",
          socket.id
        );

        let disconnectedId =
          null;

        let disconnectedRole =
          null;

        for (const [id, user] of users) {

          if (
            user.socketId ===
            socket.id
          ) {

            disconnectedId = id;

            disconnectedRole =
              user.role;

            users.delete(id);

            break;

          }

        }

        if (
          disconnectedRole ===
          "employee"
        ) {

          employees.delete(
            disconnectedId
          );

        }

        if (
          disconnectedRole ===
          "pensioner"
        ) {

          pensioners.delete(
            disconnectedId
          );

          removeWaitingCall(
            disconnectedId
          );

        }

        for (const [
          pid,
          call,
        ] of activeCalls) {

          if (
            call.pensionerId ===
              disconnectedId ||
            call.agentId ===
              disconnectedId
          ) {

            const employee =
              employees.get(
                call.agentId
              );

            const pensioner =
              pensioners.get(
                call.pensionerId
              );

            if (employee) {

              io.to(
                employee.socketId
              ).emit(
                "call-ended"
              );

              setEmployeeFree(
                call.agentId
              );

            }

            if (pensioner) {

              io.to(
                pensioner.socketId
              ).emit(
                "call-ended"
              );

            }

            activeCalls.delete(
              pid
            );

          }

        }

        assignWaitingCalls();

        sendQueueUpdate();

      }
    );

  });

  /* =====================================
      CLEANUP
  ===================================== */

  setInterval(() => {

    const now = Date.now();

    for (const [
      id,
      employee,
    ] of employees) {

      if (
        employee.lastSeen &&
        now -
          employee.lastSeen >
          60000
      ) {

        employees.delete(id);

      }

    }

    for (const [
      id,
      pensioner,
    ] of pensioners) {

      if (
        pensioner.lastSeen &&
        now -
          pensioner.lastSeen >
          60000
      ) {

        pensioners.delete(id);

        removeWaitingCall(id);

      }

    }

    sendQueueUpdate();

  }, 30000);

};
