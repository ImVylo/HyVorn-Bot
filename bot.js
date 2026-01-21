// HyVornBot - Main Entry Point
// Created by ImVylo

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import HyVornClient from './src/core/Client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load configuration
const configPath = path.join(__dirname, 'config.json');

if (!fs.existsSync(configPath)) {
  console.error('config.json not found! Please copy config.example.json to config.json and fill in your bot token.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Validate configuration
if (!config.token || config.token === 'YOUR_BOT_TOKEN_HERE') {
  console.error('Please set your bot token in config.json');
  process.exit(1);
}

if (!config.clientId || config.clientId === 'YOUR_CLIENT_ID_HERE') {
  console.error('Please set your client ID in config.json');
  process.exit(1);
}

// Create and initialize the bot
const client = new HyVornClient();

// Handle process signals for graceful shutdown
process.on('SIGINT', () => client.shutdown());
process.on('SIGTERM', () => client.shutdown());

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (error) => {
  client.logger.error('Bot', 'Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  client.logger.fatal('Bot', 'Uncaught exception:', error);
  process.exit(1);
});

// Start the bot
async function main() {
  try {
    await client.init(config);
    await client.start(config.token);
  } catch (error) {
    client.logger.fatal('Bot', 'Failed to start:', error);
    process.exit(1);
  }
}

main();
