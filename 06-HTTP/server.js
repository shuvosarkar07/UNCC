const http = require("node:http");

const server = http.createServer();

server.on("request", (req, res) => {
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  console.log("Request headers: ", req.headers);

  req.on("data", (chunk) => {
    console.log(`Request body chunk: ${chunk.toString()}`);
  });
  
  req.on("end", () => {
    res.end();
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
