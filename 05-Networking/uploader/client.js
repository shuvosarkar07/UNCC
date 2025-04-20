const net = require("net");
const fs = require("fs");

const socket = net.createConnection({ port: 8080, host: "127.0.0.1" }, () => {
  console.log("Connected to server!\n");

  const fileStream = fs.createReadStream("windows11.iso");

  fileStream.on("data", (chunk) => {
    const canWrite = socket.write(chunk);

    if (!canWrite) {
      fileStream.pause();

      socket.once("drain", () => {
        fileStream.resume();
      });
    }
  });

  fileStream.on("end", () => {
    console.log("Data sent to server successfully");
    console.log("File stream ended, closing socket.");
    socket.end();
  });

  fileStream.on("error", (err) => {
    console.error("Error reading file:", err);
    socket.end();
  });
});

socket.on("error", (err) => {
  console.error("Socket error:", err);
});

socket.on("end", () => {
  console.log("Disconnected from server");
});
