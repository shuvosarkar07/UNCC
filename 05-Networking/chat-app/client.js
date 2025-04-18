const net = require("net");
const readline = require("readline/promises");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clearLine = (dir) => {
  return new Promise((resolve) => {
    process.stdout.clearLine(dir, () => resolve());
  });
};

const moveCursor = (dx, dy) => {
  return new Promise((resolve) => {
    process.stdout.moveCursor(dx, dy, () => resolve());
  });
};

const client = net.createConnection(
  { host: "127.0.0.1", port: 3000 },
  async () => {
    console.log("Connected to the server!");

    const ask = async () => {
      const message = await rl.question("message: ");

      if (message === "exit") {
        await moveCursor(0, -1);
        await clearLine(0);
        process.stdout.write("Goodbye!\n");
        client.end();
        return;
      }

      await moveCursor(0, -1);
      await clearLine(0);

      client.write(message);
    };

    ask();
    client.ask = ask;
  },
);

client.on("data", async (data) => {
  if (client.destroyed) return;

  console.log();
  await moveCursor(0, -1);
  await clearLine(0);

  process.stdout.write(data.toString("utf-8") + "\n");
  if (!client.destroyed) {
    client.ask();
  }
});

client.on("error", (err) => {
  console.error(err);
  client.end();
});

client.on("close", () => {
  console.log("Connection was ended!");
  rl.close();
  process.exit(0);
});
