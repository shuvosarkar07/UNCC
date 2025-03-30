// 0100 1000 0110 1001 0010 0001
const { Buffer } = require("buffer");

/*
const bufferContainer = Buffer.alloc(3);

bufferContainer[0] = 0x48;
bufferContainer[1] = 0x69;
bufferContainer[2] = 0x21;

console.log(bufferContainer);
console.log(bufferContainer.toString());

const bufferContainer2 = Buffer.from("Hello");
console.log(bufferContainer2.toString("utf-8"));


const bufferContainer3 = Buffer.from("48656c6c6f", "hex");
console.log(bufferContainer3.toString("utf-8"));
*/

const bufferContainer4 = Buffer.from("48656c6c6f", "hex");
console.log(bufferContainer4.toString("utf-8"));
