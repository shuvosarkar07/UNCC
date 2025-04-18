const fs = require("fs/promises");

(async () => {
  console.time("copy");

  const srcFile = await fs.open("song.mp4", "r");
  const destFile = await fs.open("song-copy.mp4", "w");

  let bytesRead = -1;

  while (bytesRead !== 0) {
    const readResult = await srcFile.read();
    bytesRead = readResult.bytesRead;

    if (bytesRead > 0) {
      await destFile.write(readResult.buffer);
    }
  }

  await srcFile.close();
  await destFile.close();

  console.timeEnd("copy");
})();
