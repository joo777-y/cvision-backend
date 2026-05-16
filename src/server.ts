import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initGridFS } from './services/gridfsService';
import { loadSkillsDictionary } from './services/nlpService';

const startServer = async () => {
  try {
    await connectDatabase();
    initGridFS();
    await loadSkillsDictionary();

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
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
