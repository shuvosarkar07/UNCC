const { Buffer } = require("buffer");

const memoryContainer = Buffer.alloc(4);

memoryContainer[0] = 0x73;
memoryContainer[1] = 0x75;
memoryContainer[2] = 0x76;
memoryContainer[3] = 0x61;

for (let i = 0; i < memoryContainer.length; i++) {
  console.log(memoryContainer[i]);
}

console.log(memoryContainer.length);
console.log(memoryContainer);
console.log(memoryContainer.toString("utf-8"));
