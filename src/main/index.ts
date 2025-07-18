#!/usr/bin/env node

import app from "./protocols/mcp/app.js";
import { MongoDBConnection } from "../infra/mongodb/connection/mongodb-connection.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    // Initialize MongoDB connection if using MongoDB storage
    if (env.storageMode === 'mongodb') {
      const mongoConnection = MongoDBConnection.getInstance();
      await mongoConnection.connect();
      console.log('MongoDB connection initialized');
    }

    // Start MCP server
    await app.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
