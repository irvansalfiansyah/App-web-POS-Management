const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
