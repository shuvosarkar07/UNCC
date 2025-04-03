const fs = require("fs/promises");

(async () => {
  const watcher = fs.watch("./");

  for await (const event of watcher) {
    console.log(event);
  }
})();
