import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initGridFS } from './services/gridfsService';
import { loadSkillsDictionary } from './services/nlpService';

const startServer = async () => {
  const port = Number(process.env.PORT) || config.port;

  // Bind HTTP immediately so platform health checks on $PORT do not time out while MongoDB connects.
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  server.on('error', (error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });

  const port = Number(process.env.PORT) || config.port;

  // Bind HTTP immediately so platform health checks on $PORT do not time out while MongoDB connects.
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  server.on('error', (error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });

  try {
    await connectDatabase();
    initGridFS();
    loadSkillsDictionary().catch(console.error);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
