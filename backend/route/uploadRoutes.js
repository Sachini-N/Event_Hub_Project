const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

const path = require('path');
const fs = require('fs');

// Helper to copy uploaded file to frontend public folder so Vite dev server also serves it immediately
const copyToFrontend = (filename) => {
    try {
        const src = path.join(__dirname, '..', 'public', 'uploads', filename);
        const dest = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', filename);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    } catch (e) {}
};

// POST /api/upload - Single File (Image or Video)
router.post('/', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        let fileUrl;
        if (req.file.path && req.file.path.startsWith('http')) {
            fileUrl = req.file.path; // Cloudinary CDN URL
        } else {
            fileUrl = `/uploads/${req.file.filename}`;
            copyToFrontend(req.file.filename);
        }

        res.json({
            success: true,
            message: 'File uploaded successfully!',
            data: {
                url: fileUrl,
                publicId: req.file.filename,
                resourceType: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
                format: req.file.format || path.extname(req.file.originalname).slice(1),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

// POST /api/upload/gallery - Multiple Files Upload
router.post('/gallery', protect, upload.array('files', 10), (req, res) => {
    try {
        const uploadedFiles = (req.files || []).map((file) => {
            let fileUrl;
            if (file.path && file.path.startsWith('http')) {
                fileUrl = file.path;
            } else {
                fileUrl = `/uploads/${file.filename}`;
                copyToFrontend(file.filename);
            }
            return {
                url: fileUrl,
                publicId: file.filename,
            };
        });

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
