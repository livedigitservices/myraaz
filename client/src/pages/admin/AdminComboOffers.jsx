import { useState, useEffect } from 'react';
import { FiGift, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Spin = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

const EMPTY_OFFER = {
  name: '', description: '', badge: '',
  products: [],
  discountType: 'flat', discountValue: '',
  isActive: true, validFrom: '', validUntil: '',
};

/* ── Product search/picker ── */
function ProductPicker({ selected, onAdd }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${encodeURIComponent(q)}&limit=8`);
      setResults(data.products || data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const alreadyAdded = id => selected.some(s => s.product === id);

  return (
    <div className="space-y-2">
      <div className="relative">
        <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-muted)' }}/>
        <input
          className="input w-full text-sm pl-8"
          placeholder="Search product by name…"
          value={query}
          onChange={e => search(e.target.value)}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2"><Spin/></span>
        )}
      </div>

      {results.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--color-soft)' }}>
          {results.map(p => (
            <div key={p._id}
                 className="flex items-center gap-3 px-3 py-2.5 hover:bg-soft/40 cursor-pointer transition-colors"
                 onClick={() => {
                   if (!alreadyAdded(p._id)) {
                     onAdd({ product: p._id, productName: p.name, productImage: p.image,
                             productVariants: p.variants || [], variantLabel: '', quantity: 1 });
                     setQuery(''); setResults([]);
                   }
                 }}>
              <img src={p.image} alt={p.name}
                   className="w-8 h-8 rounded-lg object-cover shrink-0"
                   onError={e => e.target.style.display='none'}/>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-dark)' }}>{p.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>₹{p.price} · {p.category}</p>
              </div>
              {alreadyAdded(p._id)
                ? <FiCheck size={13} className="text-green-500 shrink-0"/>
                : <FiPlus size={13} style={{ color: 'var(--color-primary)' }} className="shrink-0"/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Offer Form (create / edit) ── */
function OfferForm({ initial, onSave, onCancel }) {
  const [form, setForm]   = useState(initial || EMPTY_OFFER);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProduct = (item) => setForm(f => ({ ...f, products: [...f.products, item] }));
  const removeProduct = (idx) => setForm(f => ({ ...f, products: f.products.filter((_, i) => i !== idx) }));
  const updateProductField = (idx, field, value) =>
    setForm(f => ({ ...f, products: f.products.map((p, i) => i === idx ? { ...p, [field]: value } : p) }));

  const submit = async () => {
    if (!form.name.trim())       return toast.error('Offer name is required');
    if (form.products.length < 2) return toast.error('Add at least 2 products');
    if (!form.discountValue)      return toast.error('Discount value is required');

    setSaving(true);
    try {
      const payload = {
        ...form,
        products: form.products.map(p => ({
          product:      p.product,
          variantLabel: p.variantLabel || '',
          quantity:     Number(p.quantity) || 1,
        })),
        discountValue: Number(form.discountValue),
        validFrom:  form.validFrom  || null,
        validUntil: form.validUntil || null,
      };
      await onSave(payload);
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl p-5 space-y-5" style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* Name + Badge */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            Offer name <span className="text-red-400">*</span>
          </label>
          <input className="input w-full text-sm" placeholder="e.g. Hair Care Bundle"
                 value={form.name} onChange={e => set('name', e.target.value)}/>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            Badge (shown on product)
          </label>
          <input className="input w-full text-sm" placeholder="e.g. Save ₹200"
                 value={form.badge} onChange={e => set('badge', e.target.value)}/>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
          Description
        </label>
        <textarea className="input w-full text-sm resize-none" rows={2}
                  placeholder="Buy hair oil + shampoo together and save!"
                  value={form.description} onChange={e => set('description', e.target.value)}/>
      </div>

      {/* Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            Discount type <span className="text-red-400">*</span>
          </label>
          <select className="input w-full text-sm" value={form.discountType}
                  onChange={e => set('discountType', e.target.value)}>
            <option value="flat">Flat (₹ off total)</option>
            <option value="percent">Percent (% off total)</option>
            <option value="fixed">Fixed bundle price (₹)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            {form.discountType === 'flat'    ? '₹ off'          :
             form.discountType === 'percent' ? 'Percent off (%)'  :
             'Bundle price (₹)'} <span className="text-red-400">*</span>
          </label>
          <input type="number" min="0" className="input w-full text-sm"
                 value={form.discountValue} onChange={e => set('discountValue', e.target.value)}/>
        </div>
      </div>

      {/* Validity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            Valid from (optional)
          </label>
          <input type="date" className="input w-full text-sm"
                 value={form.validFrom} onChange={e => set('validFrom', e.target.value)}/>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
            Valid until (optional)
          </label>
          <input type="date" className="input w-full text-sm"
                 value={form.validUntil} onChange={e => set('validUntil', e.target.value)}/>
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? '' : 'opacity-40'}`}
             style={{ backgroundColor: form.isActive ? 'var(--color-primary)' : 'var(--color-soft)' }}>
          <input type="checkbox" className="sr-only" checked={form.isActive}
                 onChange={e => set('isActive', e.target.checked)}/>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                           ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}/>
        </div>
        <span className="text-sm" style={{ color: 'var(--color-dark)' }}>Active</span>
      </label>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Products in this combo ({form.products.length})
          </p>
        </div>

        {form.products.map((p, idx) => (
          <div key={idx} className="p-3 rounded-xl space-y-2"
               style={{ border: '1.5px solid var(--color-soft)' }}>
            <div className="flex items-center gap-2">
              {p.productImage && (
                <img src={p.productImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0"/>
              )}
              <p className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--color-dark)' }}>
                {p.productName || p.product}
              </p>
              <button type="button" onClick={() => removeProduct(idx)}
                      className="p-1 rounded-lg hover:bg-red-50">
                <FiX size={13} className="text-red-400"/>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                  Size/variant (leave blank = any)
                </label>
                {p.productVariants?.length > 0
                  ? (
                    <select className="input w-full text-xs"
                            value={p.variantLabel}
                            onChange={e => updateProductField(idx, 'variantLabel', e.target.value)}>
                      <option value="">Any size</option>
                      {p.productVariants.map(v => (
                        <option key={v.label} value={v.label}>{v.label} — ₹{v.price}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="input w-full text-xs" placeholder="Any size"
                           value={p.variantLabel}
                           onChange={e => updateProductField(idx, 'variantLabel', e.target.value)}/>
                  )
                }
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Qty required</label>
                <input type="number" min="1" className="input w-full text-xs"
                       value={p.quantity}
                       onChange={e => updateProductField(idx, 'quantity', e.target.value)}/>
              </div>
            </div>
          </div>
        ))}

        <ProductPicker selected={form.products} onAdd={addProduct}/>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium
                           transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}>
          {saving ? <><Spin/> Saving…</> : <><FiCheck size={14}/> Save offer</>}
        </button>
        <button onClick={onCancel}
                className="px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:bg-soft/60"
                style={{ color: 'var(--color-muted)', border: '1.5px solid var(--color-soft)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AdminComboOffers() {
  const [offers, setOffers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState('list'); // 'list' | 'create' | 'edit'
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/combo-offers');
      setOffers(data);
    } catch { toast.error('Failed to load combo offers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    await api.post('/combo-offers', payload);
    toast.success('Combo offer created!');
    setMode('list'); load();
  };

  const handleUpdate = async (payload) => {
    await api.put(`/combo-offers/${editing._id}`, payload);
    toast.success('Combo offer updated!');
    setMode('list'); setEditing(null); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this combo offer?')) return;
    await api.delete(`/combo-offers/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleActive = async (offer) => {
    await api.put(`/combo-offers/${offer._id}`, { isActive: !offer.isActive });
    load();
  };

  const startEdit = (offer) => {
    // Map populated products back to form shape
    const formOffer = {
      ...offer,
      validFrom:  offer.validFrom  ? offer.validFrom.split('T')[0]  : '',
      validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
      products: offer.products.map(p => ({
        product:        p.product._id || p.product,
        productName:    p.product.name || '',
        productImage:   p.product.image || '',
        productVariants: p.product.variants || [],
        variantLabel:   p.variantLabel,
        quantity:       p.quantity,
      })),
    };
    setEditing(formOffer);
    setMode('edit');
  };

  const discountLabel = (offer) => {
    if (offer.discountType === 'flat')    return `₹${offer.discountValue} off`;
    if (offer.discountType === 'percent') return `${offer.discountValue}% off`;
    return `Bundle ₹${offer.discountValue}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Spin/> <span className="ml-2 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</span>
    </div>
  );

  if (mode === 'create') return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
        New combo offer
      </h1>
      <OfferForm onSave={handleCreate} onCancel={() => setMode('list')}/>
    </div>
  );

  if (mode === 'edit') return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
        Edit combo offer
      </h1>
      <OfferForm initial={editing} onSave={handleUpdate} onCancel={() => { setMode('list'); setEditing(null); }}/>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            <FiGift size={18} style={{ color: 'var(--color-primary)' }}/>
          </div>
          <div>
            <h1 className="text-xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              Combo Offers
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Bundle specific products together with a special price
            </p>
          </div>
        </div>
        <button onClick={() => setMode('create')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)' }}>
          <FiPlus size={14}/> New offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <FiGift size={32} className="mx-auto mb-3" style={{ color: 'var(--color-soft)' }}/>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No combo offers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer._id} className="bg-white rounded-2xl p-4 space-y-3"
                 style={{ boxShadow: 'var(--shadow-card)', opacity: offer.isActive ? 1 : 0.6 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                      {offer.name}
                    </p>
                    {offer.badge && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {offer.badge}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      offer.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>
                    {discountLabel(offer)}
                  </p>
                  {offer.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{offer.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(offer)}
                          className="p-2 rounded-xl hover:bg-soft/60 transition-colors text-xs"
                          style={{ color: 'var(--color-muted)' }}
                          title={offer.isActive ? 'Deactivate' : 'Activate'}>
                    {offer.isActive ? <FiX size={14}/> : <FiCheck size={14}/>}
                  </button>
                  <button onClick={() => startEdit(offer)}
                          className="p-2 rounded-xl hover:bg-soft/60 transition-colors"
                          style={{ color: 'var(--color-dark)' }}>
                    <FiEdit2 size={14}/>
                  </button>
                  <button onClick={() => handleDelete(offer._id)}
                          className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                    <FiTrash2 size={14} className="text-red-400"/>
                  </button>
                </div>
              </div>

              {/* Product pills */}
              <div className="flex flex-wrap gap-2">
                {offer.products.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs"
                       style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
                    {p.product?.image && (
                      <img src={p.product.image} alt=""
                           className="w-4 h-4 rounded-full object-cover"/>
                    )}
                    {p.product?.name || p.product}
                    {p.variantLabel && <span style={{ color: 'var(--color-muted)' }}>· {p.variantLabel}</span>}
                    {p.quantity > 1 && <span style={{ color: 'var(--color-muted)' }}>×{p.quantity}</span>}
                  </div>
                ))}
              </div>

              {(offer.validFrom || offer.validUntil) && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {offer.validFrom  && `From ${new Date(offer.validFrom).toLocaleDateString()}`}
                  {offer.validFrom && offer.validUntil && ' · '}
                  {offer.validUntil && `Until ${new Date(offer.validUntil).toLocaleDateString()}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}