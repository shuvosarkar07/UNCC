const fs = require("fs/promises");
const { EventEmitter } = require("events");

(async () => {
  const CREATE_FILE_COMMAND = "create a file";
  const DELETE_FILE_COMMAND = "delete file";
  const RENAME_FILE_COMMAND = "rename the file";
  const ADD_TO_FILE_COMMAND = "add to file";

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

  const deleteFile = async (filePath) => {
    try {
      await fs.unlink(filePath.trim());
      console.log(`File $$${filePath.trim()} deleted successfully!`);
    } catch (error) {
      console.log(`Error deleting file "${filePath.trim()}": ${error.message}`);
    }
  };

  const renameFile = async (oldFilePath, newFilePath) => {
    try {
      await fs.rename(oldFilePath.trim(), newFilePath.trim());
      console.log(
        `File ${oldFilePath.trim()} renamed to ${newFilePath.trim()}!`
      );
    } catch (error) {
      console.log(
        `Error renaming file ${oldFilePath.trim()} to ${newFilePath.trim()}, error: ${
          error.message
        }`
      );
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
    } else if (command.startsWith(DELETE_FILE_COMMAND)) {
      const filePath = command.substring(DELETE_FILE_COMMAND.length + 1);
      await deleteFile(filePath);
    } else if (command.startsWith(RENAME_FILE_COMMAND)) {
      const oldFilePath = command.substring(RENAME_FILE_COMMAND.length + 1);
      const newFilePath = command.substring(
        RENAME_FILE_COMMAND.length + 1 + oldFilePath.length + 1
      );
      await renameFile(oldFilePath, newFilePath);
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
