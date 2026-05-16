const cloudinary           = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer               = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Product image upload (existing) ── */
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'hair-store-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 800, crop: 'limit' }],
    public_id:       `product_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  }),
});

const upload = multer({
  storage: productStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
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
      ...(isVideo ? {} : { transformation: [{ width: 1600, crop: 'limit' }] }),
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