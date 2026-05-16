const HomeMedia          = require('../models/HomeMedia');
const { cloudinary }     = require('../config/cloudinary');

/* ─────────────────────────────────────────
   GET /api/home-media
   Public — returns all active media sorted by order
───────────────────────────────────────── */
const getHomeMedia = async (req, res) => {
  try {
    const media = await HomeMedia.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/home-media/admin
   Admin — returns ALL media including inactive
───────────────────────────────────────── */
const getHomeMediaAdmin = async (req, res) => {
  try {
    const media = await HomeMedia.find({}).sort({ order: 1, createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/home-media/admin
   Admin — upload image or video
   Handled by uploadHomeMedia.single('file') in route
───────────────────────────────────────── */
const createHomeMedia = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: 'No file uploaded' });

    const { title, subtitle, ctaText, ctaLink, order } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');

    const media = await HomeMedia.create({
      type:     isVideo ? 'video' : 'image',
      url:      req.file.path,
      publicId: req.file.filename,
      title:    title    || '',
      subtitle: subtitle || '',
      ctaText:  ctaText  || '',
      ctaLink:  ctaLink  || '/products',
      order:    Number(order) || 0,
      isActive: true,
    });

    res.status(201).json(media);
  } catch (err) {
    console.error('createHomeMedia error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUT /api/home-media/admin/:id
   Admin — update metadata (title, order, isActive, etc.)
   Does NOT replace the file
───────────────────────────────────────── */
const updateHomeMedia = async (req, res) => {
  try {
    const media = await HomeMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    const { title, subtitle, ctaText, ctaLink, order, isActive } = req.body;

    if (title    !== undefined) media.title    = title;
    if (subtitle !== undefined) media.subtitle = subtitle;
    if (ctaText  !== undefined) media.ctaText  = ctaText;
    if (ctaLink  !== undefined) media.ctaLink  = ctaLink;
    if (order    !== undefined) media.order    = Number(order);
    if (isActive !== undefined) media.isActive = isActive === true || isActive === 'true';

    await media.save();
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE /api/home-media/admin/:id
   Admin — delete from DB and Cloudinary
───────────────────────────────────────── */
const deleteHomeMedia = async (req, res) => {
  try {
    const media = await HomeMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.type === 'video' ? 'video' : 'image',
    }).catch(err => console.warn('Cloudinary delete warning:', err.message));

    await media.deleteOne();
    res.json({ message: 'Media deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getHomeMedia,
  getHomeMediaAdmin,
  createHomeMedia,
  updateHomeMedia,
  deleteHomeMedia,
};