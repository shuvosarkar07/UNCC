const net = require("net");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

// Configuration - Can be moved to command line args or config file
const CONFIG = {
  port: 8080,
  host: "::1",
  filePath: process.argv[2] || "song.mp4",
  chunkSize: 64 * 1024, // 64KB chunks for better control
  progressUpdateInterval: 250, // Update progress every 250ms instead of by file size
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000
};

// State tracking
const state = {
  bytesSent: 0,
  totalBytes: 0,
  startTime: 0,
  lastUpdateTime: 0,
  checksum: null,
  retryCount: 0,
  paused: false
};

// Setup line clearing for different terminals
const clearLine = process.stdout.isTTY 
  ? () => readline.clearLine(process.stdout, 0) 
  : () => {};

async function main() {
  let fileHandle = null;
  let socket = null;

  // Handle Ctrl+C gracefully
  process.on("SIGINT", async () => {
    console.log("\n🛑 Transfer interrupted by user. Cleaning up...");
    await cleanup(fileHandle, socket);
    process.exit(0);
  });

  try {
    // Validate file exists before attempting transfer
    const resolvedPath = path.resolve(CONFIG.filePath);
    
    try {
      // Get file stats first to know total size
      const stats = await fs.stat(resolvedPath);
      state.totalBytes = stats.size;
      
      if (stats.size === 0) {
        throw new Error("File is empty");
      }
      
      console.log(`📂 Preparing to send: ${resolvedPath} (${formatSize(state.totalBytes)})`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`File not found: ${resolvedPath}`);
      }
      throw err;
    }

    // Calculate checksum in background for integrity verification
    calculateChecksumAsync(resolvedPath);

    await connectWithRetry(resolvedPath);
    
  } catch (err) {
    console.error(`🚨 Error: ${err.message}`);
    process.exit(1);
  }
}

async function connectWithRetry(filePath) {
  while (state.retryCount <= CONFIG.retryAttempts) {
    try {
      if (state.retryCount > 0) {
        console.log(`🔄 Retry attempt ${state.retryCount}/${CONFIG.retryAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
      
      await initiateTransfer(filePath);
      return; // Successful connection and transfer
    } catch (err) {
      state.retryCount++;
      if (state.retryCount > CONFIG.retryAttempts) {
        console.error(`❌ Failed after ${CONFIG.retryAttempts} attempts: ${err.message}`);
        throw err;
      }
      console.error(`⚠️ Connection failed: ${err.message}. Retrying...`);
    }
  }
}

function calculateChecksumAsync(filePath) {
  // Calculate MD5 checksum in the background for verification
  const hash = crypto.createHash('md5');
  
  fs.open(filePath, 'r')
    .then(fileHandle => {
      const stream = fileHandle.createReadStream();
      
      stream.on('data', data => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        state.checksum = hash.digest('hex');
        console.log(`🔐 File checksum (MD5): ${state.checksum}`);
        fileHandle.close();
      });
      
      stream.on('error', err => {
        console.error(`❌ Checksum calculation error: ${err.message}`);
        fileHandle.close();
      });
    })
    .catch(err => {
      console.error(`❌ Failed to calculate checksum: ${err.message}`);
    });
}

async function initiateTransfer(filePath) {
  let fileHandle = null;
  let socket = null;
  
  return new Promise(async (resolve, reject) => {
    try {
      // Create socket connection
      socket = net.createConnection({ 
        port: CONFIG.port, 
        host: CONFIG.host 
      });
      
      // Set encoding for received data
      socket.setEncoding('utf8');
      
      // Handle connection timeout
      socket.setTimeout(CONFIG.timeout);
      
      // Set up socket event handlers
      socket.on("connect", async () => {
        console.log(`✅ Connected to server at ${CONFIG.host}:${CONFIG.port}`);
        state.startTime = Date.now();
        state.lastUpdateTime = state.startTime;
        
        try {
          // Open file after connection is established
          fileHandle = await fs.open(filePath, "r");
          
          // Setup progress updater using setInterval for smooth updates
          const progressInterval = setInterval(() => {
            if (!state.paused) {
              updateProgress();
            }
          }, CONFIG.progressUpdateInterval);
          
          // Start streaming file in controlled chunks
          await streamFile(fileHandle, socket);
          
          // Clean up progress interval
          clearInterval(progressInterval);
          
          // Show final progress and statistics
          updateProgress(true);
          showTransferSummary();
          
          // Close file handle
          if (fileHandle) {
            await fileHandle.close();
          }
          
          // Send end of transmission
          socket.end();
          resolve();
          
        } catch (err) {
          console.error(`🚨 File operation error: ${err.message}`);
          await cleanup(fileHandle, socket);
          reject(err);
        }
      });
      
      socket.on("data", (data) => {
        const message = data.toString().trim();
        if (message) {
          console.log(`📩 Server: ${message}`);
        }
      });
      
      socket.on("end", () => {
        console.log("🔌 Server closed connection");
        resolve();
      });
      
      socket.on("error", (err) => {
        console.error(`🚨 Connection error: ${err.message}`);
        reject(err);
      });
      
      socket.on("timeout", () => {
        console.warn("⏱️ Connection timed out");
        socket.destroy(new Error("Connection timeout"));
        reject(new Error("Connection timeout"));
      });
      
    } catch (err) {
      await cleanup(fileHandle, socket);
      reject(err);
    }
  });
}

async function streamFile(fileHandle, socket) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileSize = state.totalBytes;
      const chunkSize = CONFIG.chunkSize;
      let position = 0;
      let shouldContinue = true;
      
      // Handle backpressure by checking socket writability
      const processNextChunk = async () => {
        if (position >= fileSize) {
          resolve();
          return;
        }
        
        try {
          const buffer = Buffer.alloc(Math.min(chunkSize, fileSize - position));
          const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, position);
          
          if (bytesRead === 0) {
            // End of file reached
            resolve();
            return;
          }
          
          // Handle backpressure
          const canContinue = socket.write(bytesRead < buffer.length ? buffer.slice(0, bytesRead) : buffer);
          
          // Update tracking
          position += bytesRead;
          state.bytesSent += bytesRead;
          
          if (canContinue && shouldContinue) {
            // Continue reading immediately
            processNextChunk();
          }
          
        } catch (err) {
          shouldContinue = false;
          reject(err);
        }
      };
      
      // Handle drain event for backpressure
      socket.on('drain', () => {
        if (shouldContinue) {
          processNextChunk();
        }
      });
      
      // Start the first chunk
      processNextChunk();
      
    } catch (err) {
      reject(err);
    }
  });
}

async function cleanup(fileHandle, socket) {
  try {
    if (fileHandle) {
      await fileHandle.close().catch(e => console.error(`Error closing file: ${e.message}`));
    }
    
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
  } catch (err) {
    console.error(`❌ Cleanup error: ${err.message}`);
  }
}

function updateProgress(final = false) {
  const now = Date.now();
  const elapsed = (now - state.startTime) / 1000;
  const sinceLastUpdate = (now - state.lastUpdateTime) / 1000;
  
  // Only update if this is final or enough time has passed
  if (!final && sinceLastUpdate < 0.1) {
    return;
  }
  
  state.lastUpdateTime = now;
  
  const percentage = Math.min(100, (state.bytesSent / state.totalBytes * 100)).toFixed(1);
  const speed = state.bytesSent / elapsed;
  
  let remainingTime = '';
  if (!final && speed > 0) {
    const remaining = (state.totalBytes - state.bytesSent) / speed;
    remainingTime = `, ${formatTime(remaining)} remaining`;
  }
  
  // Create progress bar
  const progressBarWidth = 30;
  const completedWidth = Math.floor(progressBarWidth * state.bytesSent / state.totalBytes);
  const progressBar = '█'.repeat(completedWidth) + '░'.repeat(progressBarWidth - completedWidth);
  
  // Clear current line and write progress
  clearLine();
  process.stdout.write(
    `\r📊 [${progressBar}] ${percentage}% (${formatSize(state.bytesSent)}/${formatSize(state.totalBytes)}, ` + 
    `${formatSize(speed)}/s${remainingTime})${' '.repeat(10)}`
  );
  
  // Add newline on completion
  if (final) {
    process.stdout.write('\n');
  }
}

function showTransferSummary() {
  const elapsed = (Date.now() - state.startTime) / 1000;
  const avgSpeed = state.bytesSent / elapsed;
  
  console.log('\n📋 Transfer Summary:');
  console.log(`   ⏱️  Time: ${formatTime(elapsed)}`);
  console.log(`   📦 Size: ${formatSize(state.bytesSent)}`);
  console.log(`   🚀 Avg. Speed: ${formatSize(avgSpeed)}/s`);
  if (state.checksum) {
    console.log(`   🔐 MD5 Checksum: ${state.checksum}`);
  }
}

// Helper function to format file size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Helper function to format time
function formatTime(seconds) {
  seconds = Math.floor(seconds);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// Run the client
main().catch(err => {
  console.error(`🚨 Unhandled error: ${err.message}`);
  process.exit(1);
});