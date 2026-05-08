import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiUpload, FiX, FiBox, FiTrendingUp,
         FiUsers, FiShoppingCart, FiEye, FiCheck } from 'react-icons/fi';
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
          name:        data.name,
          description: data.description,
          price:       data.price,
          category:    data.category,
          brand:       data.brand,
          stock:       data.stock,
          image:       null,
        });
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
      if (form.image) fd.append('image', form.image);

      await api.put(`/products/admin/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
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