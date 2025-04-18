const net = require("net");
const readline = require("readline/promises");

// will explain later
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client = net.createConnection(
  { host: "127.0.0.1", port: 3000 },
  async () => {
    console.log("Connected to the server!");

    const message = await rl.question("Enter your message: ");
    client.write(message);
  }
);

client.on('data', (data) => {
  console.log(data.toString('utf-8'));
})

client.on("end", () => {
  console.log("Connection was ended!");
});
