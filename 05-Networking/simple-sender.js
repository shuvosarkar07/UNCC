const net = require("net");

const client = net.createConnection({ port: 3000, host: "127.0.0.1" }, () => {
  console.log("Connected to server!");
});

// client.on("data", (data) => {
//   console.log("Received from server: ", data.toString());
// });

// client.on("error", (err) => {
//   console.error("Client error: ", err);
// });

const buff = Buffer.from("Hello, server!");
client.write(buff);

// client.write("Hello, server!");