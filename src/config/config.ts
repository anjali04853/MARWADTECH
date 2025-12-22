import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
export const MAX_FILE_UPLOAD = process.env.MAX_FILE_UPLOAD || 1000000;
export const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploads';
