const fs = require("fs/promises");

(async () => {
  const srcFile = await fs.open("test.txt", "r");
  const readFile = await srcFile.read();

  // automatically open, read, and close the file (Great for small to medium files.)
  const data = await fs.readFile("test.txt");

  // console.log(srcFile.__proto__);
  // console.log(srcFile.constructor.name);
  // console.log(srcFile);
  console.log(readFile.buffer.toString());
  console.log(data.toString());
})();
