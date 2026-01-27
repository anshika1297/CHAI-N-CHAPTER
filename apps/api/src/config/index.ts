export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://thebookishvoyager:Reader%4012@chai-n-chapter.gvy1ste.mongodb.net/chai-n-chapter',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
};
