// ---------------Promise based---------------
/*
const fs = require("fs/promises");

(async () => {
  try {
    const data = await fs.readFile("./file.txt", "utf-8");
    console.log(data.toString());
  } catch (error) {
    console.log(error.message);
  }
})();
*/

// ---------------Callback based---------------
/*
const fs = require("fs");

fs.readFile("./file.txt", "utf-8", (err, data) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log(data.toString());
  }
});
*/

// ---------------Synchronous based---------------

const fs = require("fs");

const data = fs.readFileSync("./file.txt", "utf-8");
console.log(data.toString());
