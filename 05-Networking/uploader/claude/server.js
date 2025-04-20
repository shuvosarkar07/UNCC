const net = require("net");
const fs = require("fs");
const path = require("path");

// Configuration
const PORT = 8080;
const HOST = "::1";
const STORAGE_DIR = path.join(__dirname, "storage");
const FILE_PATH = path.join(STORAGE_DIR, "song-copy.mp4");

// Ensure storage directory exists before starting server
try {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
} catch (err) {
  console.error(`🚨 Failed to create storage directory: ${err.message}`);
  process.exit(1);
}

// Create server
const server = net.createServer((socket) => {
  console.log(`✅ New connection from ${socket.remoteAddress}`);
  
  // Set timeout to prevent hanging connections
  socket.setTimeout(60000); // 60 seconds
  
  // Track received data size
  let bytesReceived = 0;
  
  // Create write stream
  const fileStream = fs.createWriteStream(FILE_PATH);
  
  // Handle socket data
  socket.on("data", (chunk) => {
    bytesReceived += chunk.length;
    console.log(`📥 Received ${chunk.length} bytes (Total: ${bytesReceived})`);
  });
  
  // Pipe data efficiently
  socket.pipe(fileStream);
  
  // Handle connection end
  socket.on("end", () => {
    console.log(`📁 File transfer complete. Received ${bytesReceived} bytes total.`);
    fileStream.end();
  });
  
  // Handle socket timeout
  socket.on("timeout", () => {
    console.warn("⏱️ Socket timeout - closing connection");
    socket.end();
    fileStream.end();
  });
  
  // Handle socket error
  socket.on("error", (err) => {
    console.error(`🚨 Socket error: ${err.message}`);
    fileStream.destroy();
  });
  
  // Handle file stream error
  fileStream.on("error", (err) => {
    console.error(`🚨 File write error: ${err.message}`);
    socket.destroy();
    
    // Clean up the incomplete file
    try {
      fs.unlinkSync(FILE_PATH);
      console.log("🗑️ Cleaned up incomplete file");
    } catch (unlinkErr) {
      console.error(`🚨 Failed to clean up file: ${unlinkErr.message}`);
    }
  });
  
  // Handle stream finish
  fileStream.on("finish", () => {
    console.log("✓ File written successfully");
  });
});

// Handle server errors
server.on("error", (err) => {
  console.error(`🚨 Server error: ${err.message}`);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server is listening on ${HOST}:${PORT}`);
  console.log(`📂 Files will be saved to: ${FILE_PATH}`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️ Shutting down server...");
  server.close(() => {
    console.log("👋 Server closed");
    process.exit(0);
  });
});