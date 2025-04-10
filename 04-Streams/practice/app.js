const fs = require("fs/promises");

(async () => {
  console.time("copyFile");

  try {
    const readFileHandle = await fs.open("win11.iso", "r");
    const writeFileHandle = await fs.open("win11-copy.iso", "w");

    const readStream = readFileHandle.createReadStream();
    const writeStream = writeFileHandle.createWriteStream();

    // readStream.pipe(writeStream);

    readStream.on("data", (chunk) => {
      const ok = writeStream.write(chunk);

      // optional: pause if internal buffer is full
      if (!ok) {
        readStream.pause();
        writeStream.once("drain", () => {
          readStream.resume();
        });
      }
    });

    readStream.on("end", () => {
      writeStream.end(); // very important! when the read stream ends, we need to end the write stream too
    });

    writeStream.on("finish", async () => {
      console.log("Write stream finished");
      await readFileHandle.close();
      await writeFileHandle.close();
      console.log("Both files closed.");
      console.timeEnd("copyFile");
    });

    writeStream.on("error", console.error);
    readStream.on("error", console.error);
  } catch (error) {
    console.log("Error opening file:", error);
    return;
  }
})();
