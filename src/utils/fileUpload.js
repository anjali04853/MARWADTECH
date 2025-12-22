const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { UPLOAD_FOLDER, MAX_FILE_UPLOAD } = require('../config/config');

// Ensure upload directory exists
const createUploadsFolder = () => {
  if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
  }
};

// File filter configuration
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only (jpeg, jpg, png, gif, webp)!'));
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    createUploadsFolder();
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// Initialize upload
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_UPLOAD * 1024 * 1024 }, // Convert MB to bytes
  fileFilter,
});

// Single file upload middleware
const uploadFile = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: `File too large. Maximum size is ${MAX_FILE_UPLOAD}MB`,
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      
      // Everything went fine
      next();
    });
  };
};

// Multiple file upload middleware
const uploadFiles = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMultiple = upload.array(fieldName, maxCount);
    
    uploadMultiple(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: `One or more files are too large. Maximum size is ${MAX_FILE_UPLOAD}MB each`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: `Maximum ${maxCount} files are allowed`,
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      
      next();
    });
  };
};

// Delete file utility
const deleteFile = (filename) => {
  const filePath = path.join(UPLOAD_FOLDER, filename);
  
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${filename}:`, err);
          reject(err);
          return;
        }
        console.log(`File ${filename} was deleted`);
        resolve(true);
      });
    } else {
      resolve(false); // File doesn't exist
    }
  });
};

module.exports = {
  uploadFile,
  uploadFiles,
  deleteFile,
  upload,
};
