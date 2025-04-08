// const fs = require("node:fs/promises");

// (async () => {
//   console.time("writeMany");

//   const fileHandle = await fs.open("writeMany.txt", "w");

//   for (let i = 0; i < 1000000; i++) {
//     await fileHandle.write(` ${i} `);
//   }

//   console.timeEnd("writeMany");
// })();

const fs = require("node:fs/promises");

setInterval(() => {
  (async () => {
    console.time("writeMany");

    let data = "";
    for (let i = 0; i < 1_000_000; i++) {
      data += ` ${i} `;
    }

    await fs.writeFile("writeMany.txt", data);

    console.timeEnd("writeMany");
  })();
}, 1000);
