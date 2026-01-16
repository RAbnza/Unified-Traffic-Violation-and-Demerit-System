import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import logger from "./lib/logger.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Backend server running on port ${PORT}`);
});

server.on('error', (err) => {
  logger.error(`Server error: ${err.message}`);
});

// Basic error handler to ensure JSON responses
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message });
});
