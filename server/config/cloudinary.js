const cloudinary            = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer                = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Product image upload ── */
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'hair-store-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [
      { quality: 'auto:best' },   // best quality, no resize/crop
      { fetch_format: 'auto' },   // serve webp where supported
    ],
    public_id: `product_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  }),
});

const upload = multer({
  storage: productStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

/* ── Home media upload (images + videos) ── */
const homeMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder:        'hair-store-home-media',
      resource_type: isVideo ? 'video' : 'image',
      public_id:     `home_${isVideo ? 'video' : 'image'}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...(isVideo ? {} : {
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' },
        ],
      }),
    };
  },
});

const uploadHomeMedia = multer({
  storage: homeMediaStorage,
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'))
      cb(null, true);
    else
      cb(new Error('Only image or video files are allowed'), false);
  },
});

module.exports = { cloudinary, upload, uploadHomeMedia };