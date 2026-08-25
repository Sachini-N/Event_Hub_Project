const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Multer Storage for Images & Videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'eventhub_uploads',
      resource_type: isVideo ? 'video' : 'image', // Automatically detects image vs video
      allowed_formats: isVideo 
        ? ['mp4', 'mov', 'avi', 'mkv', 'webm'] 
        : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: isVideo ? [{ quality: 'auto' }] : [{ width: 1200, crop: 'limit', quality: 'auto' }],
    };
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max limit for videos
});

module.exports = { cloudinary, upload };
