import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUpload, FiX, FiBox, FiTrendingUp,
  FiUsers, FiShoppingCart, FiEye, FiCheck, FiImage,
  FiPackage,
  FiHome
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
  returnable:        true,
  returnDays:        '7',
  returnDescription: '',
});

  const [comboPrices, setComboPrices] = useState([]); // [{ quantity, price, label, _key }]
  const addComboTier = () => setComboPrices(t => [...t, { quantity: 2, price: '', label: '', _key: Math.random() }]);
  const removeComboTier = (key) => setComboPrices(t => t.filter(x => x._key !== key));
  const updateComboTier = (key, field, value) =>
    setComboPrices(t => t.map(x => x._key === key ? { ...x, [field]: value } : x));

  const [variants, setVariants] = useState([]); // [{ value, unit, price, stock, sku, _key }]
  const addVariant = () => setVariants(v => [...v, { value: '', unit: 'ml', price: '', stock: '', sku: '', _key: Math.random() }]);
  const removeVariant = (key) => setVariants(v => v.filter(x => x._key !== key));
  const updateVariant = (key, field, value) =>
    setVariants(v => v.map(x => x._key === key ? { ...x, [field]: value } : x));

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

    /* Basic fields */
    fd.append('name',        name);
    fd.append('description', description);
    fd.append('price',       price);
    fd.append('category',    category);
    fd.append('brand',       brand);
    fd.append('stock',       stock);

    /* Return policy */
    fd.append('returnable',        String(form.returnable));
    fd.append('returnDays',        form.returnDays || '7');
    fd.append('returnDescription', form.returnDescription || '');

    const tiers = comboPrices
      .filter(t => t.quantity >= 2 && t.price !== '' && Number(t.price) >= 0)
      .map(t => ({ quantity: Number(t.quantity), price: Number(t.price), label: t.label }));
    fd.append('comboPrices', JSON.stringify(tiers));

    const variantData = variants
      .filter(v => v.value > 0 && v.price !== '' && Number(v.price) >= 0)
      .map(v => ({ value: Number(v.value), unit: v.unit, price: Number(v.price), stock: Number(v.stock) || 0, sku: v.sku || '' }));
    fd.append('variants', JSON.stringify(variantData));

    /* Images */
    images.forEach(img => fd.append('images', img.file));

    await api.post('/products/admin', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.success('Product added! 🌿');
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
        <SideLink to="/admin/returns" icon={<FiPackage size={16} />} label="Returns" />
        <SideLink to="/admin/home-media" icon={<FiHome size={16} />} label="Home Media" />
        
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


{/* ── RETURN POLICY ── */}
<div className="col-span-2 pt-2">
  <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
  <p className="text-xs font-semibold uppercase tracking-widest mb-3"
     style={{ color: 'var(--color-muted)' }}>Return Policy</p>

  {/* Toggle */}
  <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer mb-3"
         style={{ backgroundColor: 'var(--color-soft)' }}>
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
        Allow Returns
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
        Customers can request a return for this product
      </p>
    </div>
    <div className="relative ml-4 shrink-0 cursor-pointer"
         onClick={() => setForm(f => ({ ...f, returnable: !f.returnable }))}>
      <div className="w-11 h-6 rounded-full transition-all duration-200"
           style={{ backgroundColor: form.returnable
             ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
        <div className="w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all"
             style={{ transform: form.returnable
               ? 'translateX(24px)' : 'translateX(4px)' }} />
      </div>
    </div>
  </label>

  {/* If returnable — show days + note */}
  {form.returnable && (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1.5"
               style={{ color: 'var(--color-dark)' }}>
          Return Window (days)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={form.returnDays}
          onChange={e => setForm(f => ({
            ...f,
            returnDays: e.target.value.replace(/[^0-9]/g, '')
          }))}
          placeholder="7"
          className="input text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5"
               style={{ color: 'var(--color-dark)' }}>
          Return Note (optional)
        </label>
        <input
          type="text"
          value={form.returnDescription}
          onChange={e => setForm(f => ({ ...f, returnDescription: e.target.value }))}
          placeholder="e.g. Seal must be intact"
          className="input text-sm"
        />
      </div>
    </div>
  )}

  {/* If NOT returnable — show reason */}
  {!form.returnable && (
    <div>
      <label className="block text-xs font-medium mb-1.5"
             style={{ color: 'var(--color-dark)' }}>
        Non-returnable Reason (shown to customer)
      </label>
      <input
        type="text"
        value={form.returnDescription}
        onChange={e => setForm(f => ({ ...f, returnDescription: e.target.value }))}
        placeholder="e.g. Due to hygiene reasons, this product cannot be returned"
        className="input text-sm"
      />
    </div>
  )}
</div>
          </div>

          {/* Volume Variants */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-muted)' }}>Volume / Size Variants</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  Add sizes like 100ml, 200ml, 1L. Each has its own price and stock.
                  If you add variants, the base price and stock above are ignored.
                </p>
              </div>
              <button type="button" onClick={addVariant}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                + Add size
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-xs py-2 text-center" style={{ color: 'var(--color-muted)' }}>
                No sizes added — single-size product.
              </p>
            )}

            <div className="space-y-3">
              {variants.map((v) => (
                <div key={v._key} className="grid grid-cols-5 gap-2 p-3 rounded-xl items-end"
                     style={{ border: '1.5px solid var(--color-soft)' }}>
                  {/* Value + Unit */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                      Size
                    </label>
                    <div className="flex gap-1.5">
                      <input type="number" min="1"
                             className="input flex-1 text-sm"
                             placeholder="100"
                             value={v.value}
                             onChange={e => updateVariant(v._key, 'value', e.target.value)}/>
                      <select className="input text-sm w-16"
                              value={v.unit}
                              onChange={e => updateVariant(v._key, 'unit', e.target.value)}>
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Price (₹)</label>
                    <input type="number" min="0"
                           className="input w-full text-sm"
                           placeholder="299"
                           value={v.price}
                           onChange={e => updateVariant(v._key, 'price', e.target.value)}/>
                  </div>
                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Stock</label>
                    <input type="number" min="0"
                           className="input w-full text-sm"
                           placeholder="50"
                           value={v.stock}
                           onChange={e => updateVariant(v._key, 'stock', e.target.value)}/>
                  </div>
                  {/* Remove */}
                  <div className="flex items-end justify-end pb-0.5">
                    <button type="button"
                            onClick={() => removeVariant(v._key)}
                            className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                      <span style={{ color: '#f87171', fontSize: 14 }}>✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combo / Bulk Pricing */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-muted)' }}>Combo / Bulk Pricing</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  Set lower unit prices when customers buy more.
                </p>
              </div>
              <button type="button" onClick={addComboTier}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                + Add tier
              </button>
            </div>

            {comboPrices.length === 0 && (
              <p className="text-xs py-2 text-center" style={{ color: 'var(--color-muted)' }}>
                No combo tiers — single unit price applies.
              </p>
            )}

            <div className="space-y-3">
              {comboPrices.map((tier, idx) => (
                <div key={tier._key} className="grid grid-cols-3 gap-3 p-3 rounded-xl items-end"
                     style={{ border: '1.5px solid var(--color-soft)' }}>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                      Min qty
                    </label>
                    <input type="number" min="2"
                           className="input w-full text-sm"
                           value={tier.quantity}
                           onChange={e => updateComboTier(tier._key, 'quantity', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                      Price/unit (₹)
                    </label>
                    <input type="number" min="0"
                           className="input w-full text-sm"
                           placeholder="e.g. 450"
                           value={tier.price}
                           onChange={e => updateComboTier(tier._key, 'price', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                        Label (optional)
                      </label>
                      <input type="text"
                             className="input w-full text-sm"
                             placeholder="Buy 2, save ₹100"
                             value={tier.label}
                             onChange={e => updateComboTier(tier._key, 'label', e.target.value)} />
                    </div>
                    <button type="button"
                            onClick={() => removeComboTier(tier._key)}
                            className="p-2 rounded-xl hover:bg-red-50 shrink-0 mb-0.5">
                      <span style={{ color: '#f87171', fontSize: 14 }}>✕</span>
                    </button>
                  </div>
                </div>
              ))}
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