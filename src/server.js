const app = require('./app');
const config = require('./config/env');
const { cleanupExpiredTokens } = require('./data/store');

const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${config.port} is already in use. Stop the other process or change PORT in your .env file.`
    );
    process.exit(1);
  }

  console.error('Failed to start server:', error.message);
  process.exit(1);
});

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);
