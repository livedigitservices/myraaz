const Product        = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

const VALID_CATEGORIES = ['hair-oil', 'shampoo', 'conditioner', 'hair-mask', 'serum'];

/* ─────────────────────────────────────────
   GET /api/products
───────────────────────────────────────── */
const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 12 } = req.query;

    // Validate + sanitize inputs
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));

    const query = {};
    if (search)   query.$text    = { $search: search };
    if (category && VALID_CATEGORIES.includes(category)) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Math.max(0, Number(minPrice));
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Math.min(5, Math.max(0, Number(minRating))) };

    const sortOptions = {
      price_asc:   { price: 1 },
      price_desc:  { price: -1 },
      rating_desc: { rating: -1 },
      newest:      { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };
    const skip   = (pageNum - 1) * limitNum;
    const total  = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortBy).skip(skip).limit(limitNum);

    res.json({ products, page: pageNum, totalPages: Math.ceil(total / limitNum), total });
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

/* ─────────────────────────────────────────
   GET /api/products/:id
───────────────────────────────────────── */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid product ID' });
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

/* ─────────────────────────────────────────
   POST /api/products/admin
───────────────────────────────────────── */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, stock } = req.body;

    if (!name?.trim())         return res.status(400).json({ message: 'Product name is required' });
    if (!description?.trim())  return res.status(400).json({ message: 'Description is required' });
    if (!price || Number(price) < 0) return res.status(400).json({ message: 'Valid price is required' });
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    if (!brand?.trim())        return res.status(400).json({ message: 'Brand is required' });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'At least one image is required' });

    const images = req.files.map(f => f.path);

    const returnPolicy = {
      returnable:  req.body.returnable !== 'false',
      returnDays:  Number(req.body.returnDays)  || 7,
      description: req.body.returnDescription   || '',
    };

    const product = await Product.create({
      name:     name.trim(),
      description: description.trim(),
      brand:    brand.trim(),
      price:    Number(price),
      category,
      stock:    Number(stock) || 0,
      images,
      image:    images[0],
      returnPolicy,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUT /api/products/admin/:id
───────────────────────────────────────── */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, category, brand, stock, removeImages } = req.body;

    if (category && !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ message: 'Invalid category' });

    if (price !== undefined && Number(price) < 0)
      return res.status(400).json({ message: 'Price cannot be negative' });

    let currentImages = [...product.images];
    if (removeImages) {
      const toRemove = JSON.parse(removeImages);
      for (const url of toRemove) {
        const publicId = url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(e => console.warn('Cloudinary delete warn:', e.message));
        currentImages = currentImages.filter(img => img !== url);
      }
    }

    if (req.files && req.files.length > 0) {
      currentImages = [...currentImages, ...req.files.map(f => f.path)];
    }

    if (currentImages.length > 4)
      return res.status(400).json({ message: 'Maximum 4 images allowed' });

    if (currentImages.length === 0)
      return res.status(400).json({ message: 'At least one image is required' });

    product.name        = name        ? name.trim()        : product.name;
    product.description = description ? description.trim() : product.description;
    product.price       = price       !== undefined ? Number(price) : product.price;
    product.category    = category    || product.category;
    product.brand       = brand       ? brand.trim()       : product.brand;
    product.stock       = stock       !== undefined ? Number(stock) : product.stock;
    product.images      = currentImages;
    product.image       = currentImages[0];

    if (req.body.returnable !== undefined) {
      product.returnPolicy = {
        returnable:  req.body.returnable !== 'false',
        returnDays:  Number(req.body.returnDays) || 7,
        description: req.body.returnDescription  || '',
      };
    }

    await product.save();
    res.json(product);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid product ID' });
    console.error('updateProduct error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE /api/products/admin/:id
───────────────────────────────────────── */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Clean up Cloudinary images
    for (const url of product.images || []) {
      const publicId = url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(e => console.warn('Cloudinary delete warn:', e.message));
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid product ID' });
    console.error('deleteProduct error:', err.message);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };