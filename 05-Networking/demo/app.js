const http = require("http");

const port = 4080;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("connection", "close");
  const data = { message: "Hello, World!" };
  res.end(JSON.stringify(data));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
