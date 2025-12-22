require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  mongoUri: process.env.MONGODB_URI,
  maxFileUpload: process.env.MAX_FILE_UPLOAD,
  uploadFolder: process.env.UPLOAD_FOLDER,
};

// Export individual configs
module.exports = {
  PORT: config.port,
  NODE_ENV: config.nodeEnv,
  JWT_SECRET: config.jwtSecret,
  JWT_EXPIRE: config.jwtExpire,
  MONGODB_URI: config.mongoUri,
  MAX_FILE_UPLOAD: config.maxFileUpload,
  UPLOAD_FOLDER: config.uploadFolder,
};
