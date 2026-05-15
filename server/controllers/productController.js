const Product    = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

/* ─────────────────────────────────────────
   GET /api/products
───────────────────────────────────────── */
const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    let query = {};
    if (search)   query.$text    = { $search: search };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const sortOptions = {
      price_asc:   { price: 1 },
      price_desc:  { price: -1 },
      rating_desc: { rating: -1 },
      newest:      { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };
    const skip     = (page - 1) * limit;
    const total    = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortBy).skip(skip).limit(Number(limit));
    res.json({ products, page: Number(page), totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/products/admin
───────────────────────────────────────── */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, stock } = req.body;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'At least one image is required' });

    const images = req.files.map(f => f.path);

    const returnPolicy = {
      returnable:  req.body.returnable !== 'false',
      returnDays:  Number(req.body.returnDays)  || 7,
      description: req.body.returnDescription   || '',
    };

    const product = await Product.create({
      name, description, brand,
      price:    Number(price),
      category,
      stock:    Number(stock),
      images,
      image:    images[0],
      returnPolicy,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err.message);
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

    let currentImages = [...product.images];
    if (removeImages) {
      const toRemove = JSON.parse(removeImages);
      for (const url of toRemove) {
        const publicId = url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        currentImages = currentImages.filter(img => img !== url);
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      currentImages   = [...currentImages, ...newImages];
    }

    if (currentImages.length > 4)
      return res.status(400).json({ message: 'Maximum 4 images allowed' });

    if (currentImages.length === 0)
      return res.status(400).json({ message: 'At least one image is required' });

    product.name        = name        || product.name;
    product.description = description || product.description;
    product.price       = price       ? Number(price)  : product.price;
    product.category    = category    || product.category;
    product.brand       = brand       || product.brand;
    product.stock       = stock       ? Number(stock)  : product.stock;
    product.images      = currentImages;
    product.image       = currentImages[0];

    if (req.body.returnable !== undefined) {
      product.returnPolicy = {
        returnable:  req.body.returnable !== 'false',
        returnDays:  Number(req.body.returnDays)  || 7,
        description: req.body.returnDescription   || '',
      };
    }

    await product.save();
    res.json(product);
  } catch (err) {
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

    for (const url of product.images || []) {
      const publicId = url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };