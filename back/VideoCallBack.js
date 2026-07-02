const users = new Map();
const busyAgents = new Set();
const activeCalls = new Map();
const waitingCalls = [];

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log("Connected:", socket.id);

        socket.on("register-user", ({ userId, role }) => {

            users.set(userId, {
                socketId: socket.id,
                role
            });

            console.log("REGISTER", userId, role);

        });

        socket.on("request-agent-call", (data) => {

            const freeAgent = [...users.entries()].find(

                ([id, user]) =>

                    user.role === "employee" &&

                    !busyAgents.has(id)

            );

            if (!freeAgent) {

                waitingCalls.push(data);

                socket.emit("waiting-agent", {

                    message: "Waiting for free employee..."

                });

                return;

            }

            const [agentId, agent] = freeAgent;

            io.to(agent.socketId).emit("incoming-call", {

                pensionerId: data.pensionerId,

                signalData: data.signalData

            });

        });

        socket.on("answer-call", (data) => {

            if (busyAgents.has(data.agentId))

                return;

            busyAgents.add(data.agentId);

            activeCalls.set(data.pensionerId, {

                pensionerId: data.pensionerId,

                agentId: data.agentId

            });

            const pensioner = users.get(data.pensionerId);

            if (pensioner) {

                io.to(pensioner.socketId).emit(

                    "agent-accepted",

                    {

                        signal: data.signal,

                        agentId: data.agentId

                    }

                );

            }

        });

        socket.on("reject-call", ({ pensionerId }) => {

            const pensioner = users.get(pensionerId);

            if (pensioner) {

                io.to(pensioner.socketId).emit(

                    "call-rejected"

                );

            }

        });

        socket.on("end-call", ({ pensionerId }) => {

            const call = activeCalls.get(

                pensionerId

            );

            if (!call) return;

            const pensioner = users.get(

                call.pensionerId

            );

            const agent = users.get(

                call.agentId

            );

            if (pensioner)

                io.to(

                    pensioner.socketId

                ).emit(

                    "call-ended"

                );

            if (agent)

                io.to(

                    agent.socketId

                ).emit(

                    "call-ended"

                );

            busyAgents.delete(call.agentId);

            activeCalls.delete(call.pensionerId);

            if (waitingCalls.length > 0) {

                const nextCall = waitingCalls.shift();

                const free = [...users.entries()].find(

                    ([id, user]) =>

                        user.role === "employee" &&

                        !busyAgents.has(id)

                );

                if (free) {

                    const [nextAgentId, nextAgent] = free;

                    io.to(nextAgent.socketId).emit(

                        "incoming-call",

                        nextCall

                    );

                }

            }

        });

        socket.on("disconnect", () => {

            let disconnectedUser = null;

            for (const [id, user] of users.entries()) {

                if (user.socketId === socket.id) {

                    disconnectedUser = id;

                    users.delete(id);

                    busyAgents.delete(id);

                    break;

                }

            }

            if (disconnectedUser) {

                for (const [

                    pensionerId,

                    call

                ] of activeCalls.entries()) {

                    if (

                        call.agentId === disconnectedUser ||

                        call.pensionerId === disconnectedUser

                    ) {

                        const pensioner = users.get(

                            call.pensionerId

                        );

                        const agent = users.get(

                            call.agentId

                        );

                        if (pensioner)

                            io.to(

                                pensioner.socketId

                            ).emit(

                                "call-ended"

                            );

                        if (agent)

                            io.to(

                                agent.socketId

                            ).emit(

                                "call-ended"

                            );

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

                "Disconnected",

                socket.id

            );

        });

    });

};
