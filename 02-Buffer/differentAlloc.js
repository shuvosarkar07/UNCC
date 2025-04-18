const { Buffer } = require("buffer");

const buffer = Buffer.alloc(10000, 0);
// console.log(buffer);

const unsafeBuffer = Buffer.allocUnsafe(10000);

// for (let i = 0; i < unsafeBuffer.length; i++) {
//   if (unsafeBuffer[i] != 0) {
//     console.log(
//       `unsafeBuffer at position ${i} has value ${unsafeBuffer[i].toString(2)}`
//     );
//   }
// }

console.log(Buffer.poolSize); // 8192

//?-----Differences between alloc and allocUnsafe-----
/* 
 allocUnsafe is faster than alloc but it leaves the buffer with uninitialized data.
 alloc is slower but it initializes the buffer with zeros.
 allocUnsafe is useful when you need to allocate a large buffer and you don't care about the initial data.
 alloc is useful when you need to allocate a small buffer and you want to ensure that it is initialized with zeros.
*/

//? ----- Buffer.poolSize -----
/* 
 Buffer.poolSize is a performance optimization feature in Node.js that helps manage memory more efficiently when working with buffers. It allows Node.js to reuse memory for small buffer allocations, reducing the overhead of frequent memory operations.

 the memory pool is most beneficial for Buffer.allocUnsafe() due to its speed and lack of initialization. However, both Buffer.alloc() and Buffer.allocUnsafe() can utilize the pool for memory allocation, but the performance gains are more significant with Buffer.allocUnsafe()

 so the poolSize of 8kib is only for faster allocating of memory less than 8kib
*/
