const http = require("http");
const { Server } = require("socket.io");

const app = require('./app');
const { port, nodeEnv } = require('./config/env');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on("joinRota", (rotaId) => {
        const room = `rota_${rotaId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} entrou na sala: ${room}`);
    });

    socket.on("leaveRota", (rotaId) => {
        const room = `rota_${rotaId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} saiu da sala: ${room}`);
    });

    socket.on("disconnect", () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`RotaSegura API executando em http://localhost:${port} (${nodeEnv})`);
});
