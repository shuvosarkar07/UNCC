const net = require("net");

const server = net.createServer();
const clients = [];

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    clients.forEach((s) => s.write(data));
  });

  socket.on("error", (err) => {
    console.log("Client error:", err.message);
    removeClient(socket);
  });

  socket.on("end", () => {
    removeClient(socket);
  });

  clients.push(socket);
  updateClientCount();

  function removeClient(sock) {
    const index = clients.indexOf(sock);
    if (index !== -1) clients.splice(index, 1);
    updateClientCount();
  }

  function updateClientCount() {
    process.stdout.write(`\rActive clients: ${clients.length}`);
  }
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Server listening on", server.address());
});
