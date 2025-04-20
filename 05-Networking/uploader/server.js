const net = require("net");
const fs = require("fs");

const server = net.createServer();

server.on("connection", (socket) => {
  console.log("Client connected\n");

  const writeStream = fs.createWriteStream("storage/windows11-copy.iso", );

  socket.on("data", async (chunk) => {
    const canWrite = writeStream.write(chunk);

    if (!canWrite) {
      socket.pause();
    }

    writeStream.once('drain', () => {
      socket.resume();
    });
    
  });

  socket.on("end", () => {
    console.log("Data received from client and written to file successfully");
    console.log("Client disconnected");
    writeStream.end();
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
    writeStream.end();
  });
});

const PORT = 8080;
const HOST = "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
