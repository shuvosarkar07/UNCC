const fs = require("fs/promises");
const { EventEmitter } = require("events");

(async () => {
  const CREATE_FILE_COMMAND = "create a file";

  const createFile = async (filePath) => {
    try {
      const existingFileHandle = await fs.open("./" + filePath.trim(), "r");
      console.log(`File "${filePath.trim()}" already exists!`);
      await existingFileHandle.close();
      return;
    } catch (error) {
      const fileHandle = await fs.open(filePath.trim(), "w");
      await fileHandle.close();
      console.log(`File "${filePath.trim()}" created!`);
    }
  };

  const commandFileHandler = await fs.open("./command.txt", "r");
  const eventEmitter = new EventEmitter();

  eventEmitter.on("fileChanged", async () => {
    const stat = await commandFileHandler.stat();
    const buffer = Buffer.alloc(stat.size);

    const { buffer: readBuffer } = await commandFileHandler.read(
      buffer,
      0,
      stat.size,
      0
    );

    const command = readBuffer.toString("utf-8").trim();

    if (command.startsWith(CREATE_FILE_COMMAND)) {
      const filePath = command.substring(CREATE_FILE_COMMAND.length + 1);
      await createFile(filePath);
    }
  });

  const watcher = fs.watch("./command.txt");

  for await (const event of watcher) {
    if (event.eventType === "change") {
      eventEmitter.emit("fileChanged");
    }
  }

  await commandFileHandler.close();
})();
