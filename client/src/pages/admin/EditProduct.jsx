import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiUpload, FiX, FiBox, FiTrendingUp,
         FiUsers, FiShoppingCart, FiEye, FiCheck, 
         FiHome} from 'react-icons/fi';
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

export default function EditProduct() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview]   = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '',
    category: '', brand: '', stock: '', image: null,
  });

  const [comboPrices, setComboPrices] = useState([]);
  const addComboTier    = () => setComboPrices(t => [...t, { quantity: 2, price: '', label: '', _key: Math.random() }]);
  const removeComboTier = (key) => setComboPrices(t => t.filter(x => x._key !== key));
  const updateComboTier = (key, field, value) =>
    setComboPrices(t => t.map(x => x._key === key ? { ...x, [field]: value } : x));

  const [variants, setVariants] = useState([]);
  const addVariant    = () => setVariants(v => [...v, { value: '', unit: 'ml', price: '', stock: '', sku: '', _key: Math.random() }]);
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

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setForm({
  name:              data.name,
  description:       data.description,
  price:             data.price,
  category:          data.category,
  brand:             data.brand,
  stock:             data.stock,
  image:             null,
  returnable:        data.returnPolicy?.returnable ?? true,
  returnDays:        String(data.returnPolicy?.returnDays ?? 7),
  returnDescription: data.returnPolicy?.description ?? '',
});
        setComboPrices((data.comboPrices || []).map(t => ({ ...t, _key: Math.random() })));
        setVariants((data.variants || []).map(v => ({ ...v, _key: Math.random() })));
        setPreview(data.image);
      } catch {
        toast.error('Failed to load product');
        navigate('/admin/products');
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [id]);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    if (file.size > 5 * 1024 * 1024)    return toast.error('Image must be under 5MB');
    setForm(f => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const fd = new FormData();
    ['name','description','price','category','brand','stock'].forEach(k =>
      fd.append(k, form[k])
    );

    /* Return policy */
    fd.append('returnable',        String(form.returnable));
    fd.append('returnDays',        form.returnDays || '7');

    const tiers = comboPrices
      .filter(t => t.quantity >= 2 && t.price !== '' && Number(t.price) >= 0)
      .map(t => ({ quantity: Number(t.quantity), price: Number(t.price), label: t.label }));
    fd.append('comboPrices', JSON.stringify(tiers));

    const variantData = variants
      .filter(v => v.value > 0 && v.price !== '' && Number(v.price) >= 0)
      .map(v => ({ value: Number(v.value), unit: v.unit, price: Number(v.price), stock: Number(v.stock) || 0, sku: v.sku || '' }));
    fd.append('variants', JSON.stringify(variantData));
    fd.append('returnDescription', form.returnDescription || '');

    if (form.image) fd.append('images', form.image);

    await api.put(`/products/admin/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    toast.success('Product updated! ✅');
    navigate('/admin/products');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update product');
  } finally {
    setLoading(false);
  }
};

  if (fetching) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 rounded-full"
           style={{ borderColor: 'var(--color-soft)', borderTopColor: 'var(--color-primary)' }} />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <SideLink to="/admin"          icon={<FiTrendingUp size={16} />}   label="Dashboard"       />
        <SideLink to="/admin/products" icon={<FiBox size={16} />}          label="Products" active />
        <SideLink to="/admin/orders"   icon={<FiShoppingCart size={16} />} label="Orders"          />
        <SideLink to="/admin/users"    icon={<FiUsers size={16} />}        label="Users"           />
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
            Edit Product
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Update product details. Leave image empty to keep the existing one.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
              Product Image
            </h2>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-3"
                 style={{ backgroundColor: 'var(--color-soft)' }}>
              {preview && <img src={preview} className="w-full h-full object-contain" />}
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                              font-medium cursor-pointer w-fit transition-all hover:opacity-80"
                   style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
              <FiUpload size={14} /> Change Image
              <input type="file" accept="image/*" className="hidden"
                     onChange={e => handleImage(e.target.files[0])} />
            </label>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-dark)' }}>
              Product Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Product Name</label>
                <input type="text" name="name" value={form.name}
                  onChange={handleChange} className="input text-sm" />
              </div>
              {[
                { name: 'brand', label: 'Brand',    type: 'text'   },
                { name: 'price', label: 'Price (₹)', type: 'number' },
                { name: 'stock', label: 'Stock',    type: 'number' },
              ].map(({ name, label, type }) => (
                <div key={name} className="col-span-1">
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: 'var(--color-dark)' }}>{label}</label>
                  <input type={type} name={name} value={form[name]}
                    onChange={handleChange} className="input text-sm" />
                </div>
              ))}
              <div className="col-span-1">
                <label className="block text-xs font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="input text-sm" style={{ color: 'var(--color-dark)' }}>
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
                  className="input resize-none text-sm" />
              </div>
            </div>

            {/* ── Return Policy ── */}
<div className="col-span-2">
  <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-soft)' }} />
  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
      style={{ color: 'var(--color-muted)' }}>Return Policy</h3>

  {/* Returnable toggle */}
  <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer mb-3"
         style={{ backgroundColor: 'var(--color-soft)' }}>
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
        Returnable Product
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
        Allow customers to request returns for this product
      </p>
    </div>
    <div className="relative ml-4 shrink-0">
      <input
        type="checkbox"
        name="returnable"
        checked={form.returnable ?? true}
        onChange={e => setForm(f => ({ ...f, returnable: e.target.checked }))}
        className="sr-only"
      />
      <div className="w-11 h-6 rounded-full transition-colors cursor-pointer"
           style={{ backgroundColor: (form.returnable ?? true)
             ? 'var(--color-primary)' : 'var(--color-secondary)' }}
           onClick={() => setForm(f => ({ ...f, returnable: !(f.returnable ?? true) }))}>
        <div className="w-4 h-4 bg-white rounded-full shadow-md absolute top-1 transition-transform"
             style={{ transform: (form.returnable ?? true)
               ? 'translateX(24px)' : 'translateX(4px)' }} />
      </div>
    </div>
  </label>

  {/* Return days + description — only if returnable */}
  {(form.returnable ?? true) && (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1.5"
               style={{ color: 'var(--color-dark)' }}>
          Return Window (days)
        </label>
        <input
          type="text"
          inputMode="numeric"
          name="returnDays"
          value={form.returnDays ?? 7}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setForm(f => ({ ...f, returnDays: val }));
          }}
          placeholder="7"
          className="input text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5"
               style={{ color: 'var(--color-dark)' }}>
          Policy Note (shown to customer)
        </label>
        <input
          type="text"
          name="returnDescription"
          value={form.returnDescription ?? ''}
          onChange={e => setForm(f => ({ ...f, returnDescription: e.target.value }))}
          placeholder="e.g. Opened items not returnable"
          className="input text-sm"
        />
      </div>
    </div>
  )}

  {/* Non-returnable reason */}
  {!(form.returnable ?? true) && (
    <div>
      <label className="block text-xs font-medium mb-1.5"
             style={{ color: 'var(--color-dark)' }}>
        Non-returnable Reason (shown to customer)
      </label>
      <input
        type="text"
        name="returnDescription"
        value={form.returnDescription ?? ''}
        onChange={e => setForm(f => ({ ...f, returnDescription: e.target.value }))}
        placeholder="e.g. Due to hygiene reasons, this product cannot be returned"
        className="input text-sm"
      />
    </div>
  )}
</div>

          </div>

          {/* Volume / Size Variants */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-muted)' }}>Volume / Size Variants</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  100ml, 200ml, 1L etc. Each size has its own price and stock.
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
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Size</label>
                    <div className="flex gap-1.5">
                      <input type="number" min="1" className="input flex-1 text-sm" placeholder="100"
                             value={v.value} onChange={e => updateVariant(v._key, 'value', e.target.value)}/>
                      <select className="input text-sm w-16" value={v.unit}
                              onChange={e => updateVariant(v._key, 'unit', e.target.value)}>
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Price (₹)</label>
                    <input type="number" min="0" className="input w-full text-sm" placeholder="299"
                           value={v.price} onChange={e => updateVariant(v._key, 'price', e.target.value)}/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Stock</label>
                    <input type="number" min="0" className="input w-full text-sm" placeholder="50"
                           value={v.stock} onChange={e => updateVariant(v._key, 'stock', e.target.value)}/>
                  </div>
                  <div className="flex items-end justify-end pb-0.5">
                    <button type="button" onClick={() => removeVariant(v._key)}
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
              {comboPrices.map((tier) => (
                <div key={tier._key} className="grid grid-cols-3 gap-3 p-3 rounded-xl items-end"
                     style={{ border: '1.5px solid var(--color-soft)' }}>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Min qty</label>
                    <input type="number" min="2" className="input w-full text-sm"
                           value={tier.quantity} onChange={e => updateComboTier(tier._key, 'quantity', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Price/unit (₹)</label>
                    <input type="number" min="0" className="input w-full text-sm" placeholder="e.g. 450"
                           value={tier.price} onChange={e => updateComboTier(tier._key, 'price', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>Label</label>
                      <input type="text" className="input w-full text-sm" placeholder="Buy 2, save ₹100"
                             value={tier.label} onChange={e => updateComboTier(tier._key, 'label', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeComboTier(tier._key)}
                            className="p-2 rounded-xl hover:bg-red-50 shrink-0 mb-0.5">
                      <span style={{ color: '#f87171', fontSize: 14 }}>✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                  Saving...
                </>
              ) : (
                <><FiCheck size={15} /> Save Changes</>
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