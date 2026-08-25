const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// POST /api/upload - Single File (Image or Video)
router.post('/', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        res.json({
            success: true,
            message: 'File uploaded to Cloudinary successfully!',
            data: {
                url: req.file.path,             // Cloudinary HTTPS CDN URL
                publicId: req.file.filename,     // Cloudinary Public Asset ID
                resourceType: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
                format: req.file.format,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

// POST /api/upload/gallery - Multiple Files Upload
router.post('/gallery', protect, upload.array('files', 10), (req, res) => {
    try {
        const uploadedFiles = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
        }));

        res.json({
            success: true,
            count: uploadedFiles.length,
            data: uploadedFiles,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gallery upload failed', error: error.message });
    }
});

module.exports = router;
