const fs = require("fs/promises");
const { EventEmitter } = require('events');

(async () => {
  const commandFileHandler = await fs.open("./command.txt");
  const eventEmitter = new EventEmitter();


  eventEmitter.on("fileChanged", async () => {

    const stat = await commandFileHandler.stat();
    const buffer = Buffer.alloc(stat.size);
    const size = stat.size;
    const offset = 0;
    const position = 0;

    const content = await commandFileHandler.read(
      buffer,
      offset,
      size,
      position
    );
    console.log(content.buffer.toString('utf-8'));
  });


  const watcher = fs.watch("./command.txt");
  for await (const event of watcher) {
    if (event.eventType === "change") {
      eventEmitter.emit("fileChanged");
    }
  }
  
  await commandFileHandler.close();
})();
