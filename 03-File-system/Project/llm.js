const fs = require("fs/promises");
const { watch } = require("fs");
const { EventEmitter } = require("events");

(async () => {
  const COMMANDS = {
    CREATE_FILE: "create a file",
    DELETE_FILE: "delete file",
    RENAME_FILE: "rename the file",
    ADD_TO_FILE: "add to file",
  };

  const createFile = async (filePath, content = "") => {
    const normalizedPath = filePath.trim();
    if (!normalizedPath) {
      console.error("Filename cannot be empty");
      return;
    }

    try {
      await fs.access(normalizedPath);
      console.log(`File "${normalizedPath}" already exists!`);
    } catch {
      await fs.writeFile(normalizedPath, content);
      console.log(`File "${normalizedPath}" created successfully!`);
    }
  };

  const deleteFile = async (filePath) => {
    const normalizedPath = filePath.trim();
    if (!normalizedPath) {
      console.error("No file specified for deletion");
      return;
    }

    try {
      await fs.unlink(normalizedPath);
      console.log(`File "${normalizedPath}" deleted successfully!`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`File "${normalizedPath}" doesn't exist`);
      } else {
        console.error(
          `Error deleting file "${normalizedPath}": ${error.message}`
        );
      }
    }
  };

  const renameFile = async (oldFilePath, newFilePath) => {
    const normalizedOldPath = oldFilePath.trim();
    const normalizedNewPath = newFilePath.trim();

    if (!normalizedOldPath || !normalizedNewPath) {
      console.error("Both old and new filenames must be specified");
      return;
    }

    try {
      await fs.rename(normalizedOldPath, normalizedNewPath);
      console.log(`Renamed "${normalizedOldPath}" to "${normalizedNewPath}"`);
    } catch (error) {
      console.error(`Error renaming file: ${error.message}`);
    }
  };

  const addToFile = async (filePath, content) => {
    const normalizedPath = filePath.trim();
    if (!normalizedPath) {
      console.error("No file specified");
      return;
    }

    try {
      await fs.appendFile(normalizedPath, content + "\n");
      console.log(`Content added to "${normalizedPath}"`);
    } catch (error) {
      console.error(`Error appending: ${error.message}`);
    }
  };

  const parseCommand = (command) => {
    if (!command) return { type: null, args: [] };

    if (command.startsWith(COMMANDS.CREATE_FILE)) {
      const filePath = command.substring(COMMANDS.CREATE_FILE.length).trim();
      return { type: COMMANDS.CREATE_FILE, args: [filePath] };
    } else if (command.startsWith(COMMANDS.DELETE_FILE)) {
      const filePath = command.substring(COMMANDS.DELETE_FILE.length).trim();
      return { type: COMMANDS.DELETE_FILE, args: [filePath] };
    } else if (command.startsWith(COMMANDS.RENAME_FILE)) {
      const parts = command
        .substring(COMMANDS.RENAME_FILE.length)
        .trim()
        .split(/\s+/);
      if (parts.length < 2) {
        console.error("Rename command requires both old and new filenames");
        return { type: null, args: [] };
      }
      return {
        type: COMMANDS.RENAME_FILE,
        args: [parts[0], parts.slice(1).join(" ")],
      };
    } else if (command.startsWith(COMMANDS.ADD_TO_FILE)) {
      const parts = command
        .substring(COMMANDS.ADD_TO_FILE.length)
        .trim()
        .split(/\s+/);
      if (parts.length < 2) {
        console.error("Add command requires filename and content");
        return { type: null, args: [] };
      }
      return {
        type: COMMANDS.ADD_TO_FILE,
        args: [parts[0], parts.slice(1).join(" ")],
      };
    }

    console.error(`Unknown command: ${command}`);
    return { type: null, args: [] };
  };

  // Outer scope for cleanup
  let watcher;

  try {
    const eventEmitter = new EventEmitter();

    eventEmitter.on("fileChanged", async () => {
      try {
        const command = (await fs.readFile("./command.txt", "utf-8")).trim();
        const { type, args } = parseCommand(command);

        switch (type) {
          case COMMANDS.CREATE_FILE:
            await createFile(args[0]);
            break;
          case COMMANDS.DELETE_FILE:
            await deleteFile(args[0]);
            break;
          case COMMANDS.RENAME_FILE:
            await renameFile(args[0], args[1]);
            break;
          case COMMANDS.ADD_TO_FILE:
            await addToFile(args[0], args[1]);
            break;
        }
      } catch (error) {
        console.error(`Error processing command: ${error.message}`);
      }
    });

    watcher = watch("./command.txt", (eventType) => {
      if (eventType === "change") {
        eventEmitter.emit("fileChanged");
      }
    });

    watcher.on("error", (error) => {
      console.error(`Watcher error: ${error.message}`);
    });
  } catch (error) {
    console.error(`Initialization error: ${error.message}`);
  }

  // Optional: Cleanup on exit
  process.on("SIGINT", () => {
    if (watcher) watcher.close();
    console.log("\nWatcher closed. Exiting.");
    process.exit();
  });
})();
