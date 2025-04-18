const net = require("net");

const server = net.createServer();
const clients = [];
let nextClientId = 1; // Always increments, never reuses

server.on("connection", (socket) => {
  const clientId = nextClientId++;

  const client = { id: clientId, socket };
  clients.push(client);
  updateClientCount();
  broadcast(`Client ${clientId} has joined the chat\n`, client, true);

  socket.on("data", (data) => {
    broadcast(data.toString(), client);
  });

  socket.on("end", () => {
    console.log(`Client ${clientId} disconnected`);
    removeClient(socket);
  });

  socket.on("error", (err) => {
    console.log(`Client ${clientId} error:`, err.message);
    removeClient(socket);
  });

  function broadcast(message, senderClient, systemMessage = false) {
    clients.forEach((c) => {
      if (c.socket === senderClient.socket) {
        // Message for the sender
        if (systemMessage) {
          c.socket.write("You joined\n");
        } else {
          c.socket.write(`You: ${message}\n`);
        }
      } else {
        // Message for others
        if (systemMessage) {
          c.socket.write(message); // No prefix
        } else {
          c.socket.write(`Client ${senderClient.id}: ${message}\n`);
        }
      }
    });
  }
  

  function removeClient(sock) {
    const index = clients.findIndex((c) => c.socket === sock);
    if (index !== -1) {
      const client = clients[index];
      client.socket.write("You left the chat\n");
      clients.splice(index, 1);
      broadcast(`Client ${client.id} has left the chat\n`, client, true);
    }
    updateClientCount();
  }

  function updateClientCount() {
    if (clients.length === 0) {
      console.log("No active clients");
    } else {
      console.log(`Active clients: ${clients.length}`);
    }
  }
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Server listening on", server.address());
});
