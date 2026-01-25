import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';

const startServer = async () => {
  await connectDatabase();
  
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
};

startServer();
