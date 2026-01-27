import path from 'path';
import dotenv from 'dotenv';

// Load apps/api/.env and force it to override any existing env vars (so API always uses same DB as seed)
const apiEnvPath = path.join(process.cwd(), 'apps/api', '.env');
const cwdEnvPath = path.join(process.cwd(), '.env');
dotenv.config({ path: cwdEnvPath });
dotenv.config({ path: apiEnvPath, override: true });

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
