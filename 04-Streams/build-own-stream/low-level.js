const fs = require("fs/promises");

(async () => {
  console.time("time");
  // const handle = await fs.open("song.mp4", "r");

  // const chunk = await handle.read({
  //   buffer: Buffer.alloc(100),
  //   offset: 0,
  //   length: 100,
  //   position: 0,
  // });

  // console.log(chunk);

  const handle = await fs.open("song.mp4", "r");
  const buffer = Buffer.alloc(65536); // 64KB buffer
  let position = 0;
  let bytesRead;

  do {
    const result = await handle.read({
      buffer,
      offset: 0,
      length: 100,
      position,
    });
    bytesRead = result.bytesRead;
    console.log(result.buffer.slice(0, bytesRead));
    position += bytesRead;
  } while (bytesRead > 0);

  await handle.close();

  console.timeEnd("time");
})();
