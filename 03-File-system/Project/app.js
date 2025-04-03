const fs = require("fs/promises");

(async () => {
  const commandFileHandler = await fs.open("./command.txt");
  const watcher = fs.watch("./command.txt");

  for await (const event of watcher) {
    if (event.eventType === "change") {
      console.log("file changed");

      const stat = await commandFileHandler.stat();
      const buffer = Buffer.alloc(stat.size);
      const size = stat.size;
      const offset = 0;
      const encoding = "utf-8";

      const content = await commandFileHandler.read(
        buffer,
        offset,
        size,
        encoding
      );
      console.log(content.toString());
    }
  }
})();
