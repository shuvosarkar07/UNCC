const fs = require("fs");

const content = fs.readFileSync("./text.txt", "utf-8");
console.log(content);
