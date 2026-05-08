import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUpload, FiX, FiBox, FiTrendingUp,
  FiUsers, FiShoppingCart, FiEye, FiCheck, FiImage
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* Multiple images — max 4 */
  const [images, setImages]     = useState([]); // { file, preview }

  const [form, setForm] = useState({
    name: '', description: '', price: '',
    category: '', brand: '', stock: '',
  });

  const categories = [
    { value: 'hair-oil',    label: '🌿 Hair Oil'    },
    { value: 'shampoo',     label: '🧴 Shampoo'     },
    { value: 'conditioner', label: '✨ Conditioner' },
    { value: 'hair-mask',   label: '🍯 Hair Mask'   },
    { value: 'serum',       label: '💧 Serum'       },
  ];

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImages = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (images.length + valid.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    const newImgs = valid.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from, to) => {
    setImages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImages(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, category, brand, stock } = form;
    if (!name || !description || !price || !category || !brand || !stock)
      return toast.error('Please fill in all fields');
    if (images.length === 0)
      return toast.error('Please upload at least one image');

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries({ name, description, price, category, brand, stock })
        .forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img.file));

      await api.post('/products/admin', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Product added successfully! 🌿');
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}   label="Dashboard"        />
        <SideLink to="/admin/products" icon={<FiBox size={16} />}          label="Products" active  />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />} label="Orders"           />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}        label="Users"            />
        <div className="mt-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 max-w-3xl">
        <div className="mb-7">
          <Link to="/admin/products"
            className="text-xs flex items-center gap-1 mb-4 hover:underline"
            style={{ color: 'var(--color-muted)' }}>
            ← Back to Products
          </Link>
          <h1 className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Add New Product
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Fill in the details and upload up to 4 product images.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── IMAGE UPLOAD ── */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                Product Images
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                {images.length}/4 images
              </span>
            </div>

            {/* Uploaded images grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <img src={img.preview} alt={`Image ${i + 1}`}
                         className="w-full h-full object-cover" />

                    {/* Primary badge */}
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md
                                      text-white text-xs font-semibold"
                           style={{ backgroundColor: 'var(--color-primary)', fontSize: '9px' }}>
                        Main
                      </div>
                    )}

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                    transition-opacity flex items-center justify-center gap-1.5">
                      {/* Move left */}
                      {i > 0 && (
                        <button type="button" onClick={() => moveImage(i, i - 1)}
                          className="w-6 h-6 bg-white rounded-full flex items-center
                                     justify-center text-xs font-bold"
                          style={{ color: 'var(--color-dark)' }}>
                          ←
                        </button>
                      )}
                      {/* Remove */}
                      <button type="button" onClick={() => removeImage(i)}
                        className="w-6 h-6 bg-red-500 rounded-full flex items-center
                                   justify-center">
                        <FiX size={12} color="white" />
                      </button>
                      {/* Move right */}
                      {i < images.length - 1 && (
                        <button type="button" onClick={() => moveImage(i, i + 1)}
                          className="w-6 h-6 bg-white rounded-full flex items-center
                                     justify-center text-xs font-bold"
                          style={{ color: 'var(--color-dark)' }}>
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add more slot */}
                {images.length < 4 && (
                  <button type="button"
                    onClick={() => document.getElementById('img-input').click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col
                               items-center justify-center gap-1 transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--color-soft)' }}>
                    <FiImage size={18} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Drop zone — shown when no images */}
            {images.length === 0 && (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById('img-input').click()}
                className="border-2 border-dashed rounded-2xl p-10 text-center
                           cursor-pointer transition-all duration-200"
                style={{
                  borderColor: dragOver ? 'var(--color-primary)' : 'var(--color-soft)',
                  backgroundColor: dragOver ? 'var(--color-soft)' : 'transparent',
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  <FiUpload size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                  Drop images here or click to browse
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Upload up to 4 images · PNG, JPG, WEBP · Max 5MB each
                </p>
              </div>
            )}

            <input id="img-input" type="file" accept="image/*"
                   multiple className="hidden"
                   onChange={e => handleImages(e.target.files)} />

            {/* Tips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                '📌 First image is the main display image',
                '↔ Hover images to reorder them',
                '✕ Hover to remove an image',
              ].map(tip => (
                <span key={tip} className="text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: 'var(--color-soft)',
                               color: 'var(--color-muted)' }}>
                  {tip}
                </span>
              ))}
            </div>
          </div>

          {/* ── PRODUCT DETAILS ── */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
              Product Details
            </h2>
            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Product Name</label>
                <input type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="e.g. Argan Oil Elixir"
                  className="input text-sm" />
              </div>

              {[
                { name: 'brand', label: 'Brand',    type: 'text',   placeholder: 'e.g. myRaaz' },
                { name: 'price', label: 'Price (₹)', type: 'number', placeholder: 'e.g. 599'    },
                { name: 'stock', label: 'Stock Qty', type: 'number', placeholder: 'e.g. 100'    },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name} className="col-span-1">
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>{label}</label>
                  <input type={type} name={name} value={form[name]}
                    onChange={handleChange} placeholder={placeholder}
                    className="input text-sm" />
                </div>
              ))}

              <div className="col-span-1">
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="input text-sm" style={{ color: 'var(--color-dark)' }}>
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Description</label>
                <textarea name="description" value={form.description}
                  onChange={handleChange} rows={4}
                  placeholder="Describe your product..."
                  className="input resize-none text-sm" />
              </div>
            </div>
          </div>

          {/* Live preview */}
          {(form.name || form.price) && (
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--color-muted)' }}>Live Preview</h2>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                     style={{ backgroundColor: 'var(--color-soft)' }}>
                  {images[0] && (
                    <img src={images[0].preview} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                    {form.name || 'Product Name'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {form.brand || 'Brand'} · {form.category || 'Category'}
                  </p>
                  <p className="text-base font-semibold mt-1"
                     style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
                    {form.price ? `₹${form.price}` : '—'}
                  </p>
                </div>
                {images.length > 1 && (
                  <div className="ml-auto flex gap-1.5">
                    {images.slice(1).map((img, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg overflow-hidden"
                           style={{ backgroundColor: 'var(--color-soft)' }}>
                        <img src={img.preview} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pb-10">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full text-white
                         font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <><FiCheck size={15} /> Add Product</>
              )}
            </button>
            <Link to="/admin/products"
              className="px-8 py-3.5 rounded-full text-sm font-medium transition-all"
              style={{ border: '1.5px solid var(--color-soft)', color: 'var(--color-muted)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}