import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUpload, FiTrash2, FiX, FiImage, FiVideo,
  FiEye, FiEyeOff, FiTrendingUp, FiBox,
  FiShoppingCart, FiUsers, FiTag, FiPackage,
  FiEdit2, FiCheck, FiHome,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import FeaturedProductPicker from './FeaturedProductPicker';


const SideLink = ({ to, icon, label, active }) => (
  <Link to={to}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
    style={{
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color:           active ? 'white' : 'var(--color-muted)',
    }}>
    {icon} {label}
  </Link>
);

const Spin = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

/* ── Inline edit row for a media card ── */
const EditForm = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title:    item.title    || '',
    subtitle: item.subtitle || '',
    ctaText:  item.ctaText  || '',
    ctaLink:  item.ctaLink  || '/products',
    order:    String(item.order ?? 0),
    isActive: item.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/home-media/admin/${item._id}`, {
        ...form,
        order:    Number(form.order),
        isActive: form.isActive,
      });
      toast.success('Updated!');
      onSave();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--color-soft)' }}>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'title',    label: 'Title',       placeholder: 'e.g. New Arrivals'    },
          { key: 'subtitle', label: 'Subtitle',    placeholder: 'e.g. Shop the latest' },
          { key: 'ctaText',  label: 'Button Text', placeholder: 'e.g. Shop Now'        },
          { key: 'ctaLink',  label: 'Button Link', placeholder: '/products'            },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium mb-1"
                   style={{ color: 'var(--color-dark)' }}>{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="input text-sm"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium mb-1"
                 style={{ color: 'var(--color-dark)' }}>Display Order</label>
          <input
            type="number"
            value={form.order}
            onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
            className="input text-sm"
          />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <span className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>Active</span>
          <div
            className="w-10 h-5 rounded-full cursor-pointer relative transition-colors"
            style={{ backgroundColor: form.isActive ? 'var(--color-primary)' : 'var(--color-soft)' }}
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
            <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform shadow"
                 style={{ transform: form.isActive ? 'translateX(22px)' : 'translateX(2px)' }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium
                     text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          {saving ? <Spin /> : <FiCheck size={13} />}
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ border: '1px solid var(--color-soft)', color: 'var(--color-muted)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ── Media card ── */
const MediaCard = ({ item, onDelete, onRefresh }) => {
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this media? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/home-media/admin/${item._id}`);
      toast.success('Deleted');
      onDelete(item._id);
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
         style={{ boxShadow: 'var(--shadow-card)', opacity: item.isActive ? 1 : 0.6 }}>

      {/* Preview */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {item.type === 'video' ? (
          <video src={item.url} className="w-full h-full object-cover"
                 muted playsInline autoPlay loop preload="metadata" />
        ) : (
          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full
                        text-xs font-medium text-white"
             style={{ backgroundColor: item.type === 'video' ? '#7C3AED' : 'var(--color-primary)' }}>
          {item.type === 'video' ? <FiVideo size={11} /> : <FiImage size={11} />}
          {item.type}
        </div>

        {/* Active / inactive badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
             style={{
               backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2',
               color:           item.isActive ? '#059669' : '#DC2626',
             }}>
          {item.isActive ? 'Active' : 'Hidden'}
        </div>

        {/* Order badge */}
        <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center
                        justify-center text-xs font-bold text-white"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {item.order}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm font-semibold line-clamp-1"
           style={{ color: 'var(--color-dark)' }}>
          {item.title || <span style={{ color: 'var(--color-muted)' }}>No title</span>}
        </p>
        {item.subtitle && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-muted)' }}>
            {item.subtitle}
          </p>
        )}
        {item.ctaText && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-primary)' }}>
            {item.ctaText} → {item.ctaLink}
          </span>
        )}

        <div className="flex gap-2 mt-3">
          <button onClick={() => setEditing(e => !e)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                       text-xs font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-dark)' }}>
            <FiEdit2 size={12} /> Edit
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                       text-xs font-medium transition-all hover:bg-red-50 disabled:opacity-50"
            style={{ color: '#DC2626', border: '1px solid #FEE2E2' }}>
            {deleting ? <Spin /> : <FiTrash2 size={12} />}
          </button>
        </div>
      </div>

      {editing && (
        <EditForm
          item={item}
          onSave={() => { setEditing(false); onRefresh(); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function AdminHomeMedia() {
  const [media,     setMedia]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  // ── Step 1: selected file + local preview ──
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null); // object URL
  const [selectedIsVideo, setSelectedIsVideo] = useState(false);
  const fileRef = useRef();

  // ── Step 2: metadata fields (filled AFTER file is chosen) ──
  const [form, setForm] = useState({
    title: '', subtitle: '', ctaText: '', ctaLink: '/products', order: '0',
  });

  const fetchMedia = async () => {
    try {
      const { data } = await api.get('/home-media/admin');
      setMedia(data);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, []);

  // Called when admin picks a file — just stores it locally, does NOT upload yet
  const handleFileSelect = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo)
      return toast.error('Only image or video files are allowed');
    if (isVideo && file.size > 50 * 1024 * 1024)
      return toast.error('Video must be under 50MB');
    if (isImage && file.size > 5 * 1024 * 1024)
      return toast.error('Image must be under 5MB');

    // Revoke previous preview URL to avoid memory leaks
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);

    setSelectedFile(file);
    setSelectedPreview(URL.createObjectURL(file));
    setSelectedIsVideo(isVideo);
  };

  const handleClearFile = () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedFile(null);
    setSelectedPreview(null);
    setSelectedIsVideo(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Called when admin clicks Upload — sends file + form fields together
  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Please select a file first');

    const fd = new FormData();
    fd.append('file',     selectedFile);
    fd.append('title',    form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('ctaText',  form.ctaText);
    fd.append('ctaLink',  form.ctaLink || '/products');
    fd.append('order',    form.order   || '0');

    try {
      setUploading(true);
      await api.post('/home-media/admin', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${selectedIsVideo ? 'Video' : 'Image'} uploaded! 🎉`);
      // Reset everything
      handleClearFile();
      setForm({ title: '', subtitle: '', ctaText: '', ctaLink: '/products', order: '0' });
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = (id) => setMedia(prev => prev.filter(m => m._id !== id));

  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white sticky top-16
                        h-[calc(100vh-64px)] border-r py-6 px-3 gap-1 shrink-0"
             style={{ borderColor: 'var(--color-soft)' }}>
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>Admin Panel</p>
          <p className="text-base font-semibold mt-0.5"
             style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>myRaaz</p>
        </div>
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--color-muted)' }}>Overview</p>
        <SideLink to="/admin"            icon={<FiTrendingUp size={16} />}   label="Dashboard"          />
        <SideLink to="/admin/products"   icon={<FiBox size={16} />}          label="Products"           />
        <SideLink to="/admin/orders"     icon={<FiShoppingCart size={16} />} label="Orders"             />
        <SideLink to="/admin/users"      icon={<FiUsers size={16} />}        label="Users"              />
        <SideLink to="/admin/coupons"    icon={<FiTag size={16} />}          label="Coupons"            />
        <SideLink to="/admin/returns"    icon={<FiPackage size={16} />}      label="Returns"            />
        <SideLink to="/admin/home-media" icon={<FiHome size={16} />}         label="Home Media" active  />
        <div className="mt-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-muted)' }}>
            <FiEye size={13} /> View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 min-w-0">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Home Media
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Upload banner images and promo videos shown below the perks bar on the homepage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Upload panel ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>
                Upload New Media
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                Step 1 — pick a file · Step 2 — fill details · Step 3 — Upload
              </p>

              {/* STEP 1: drop zone — shown when no file selected */}
              {!selectedFile && (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                             transition-all duration-200 mb-2"
                  style={{
                    borderColor:     dragOver ? 'var(--color-primary)' : 'var(--color-soft)',
                    backgroundColor: dragOver ? 'var(--color-soft)'    : 'transparent',
                  }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                                  mx-auto mb-3"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <FiUpload size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                    Drop file or click to browse
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Images (JPG, PNG, WEBP · max 5MB)
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Videos (MP4, MOV, WEBM · max 50MB)
                  </p>
                </div>
              )}

              {/* STEP 2+3: preview + fields + upload button — shown after file selected */}
              {selectedFile && (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative rounded-2xl overflow-hidden"
                       style={{ aspectRatio: '16/7', backgroundColor: 'var(--color-soft)' }}>
                    {selectedIsVideo ? (
                      <video src={selectedPreview} className="w-full h-full object-cover"
                             muted playsInline controls />
                    ) : (
                      <img src={selectedPreview} alt="preview"
                           className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1
                                    rounded-full text-xs font-medium text-white"
                         style={{ backgroundColor: selectedIsVideo ? '#7C3AED' : 'var(--color-primary)' }}>
                      {selectedIsVideo ? <FiVideo size={11} /> : <FiImage size={11} />}
                      {selectedFile.name.length > 18
                        ? selectedFile.name.slice(0, 18) + '…'
                        : selectedFile.name}
                    </div>
                    <button onClick={handleClearFile}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center
                                 justify-center text-white transition-all hover:scale-110"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <FiX size={13} />
                    </button>
                  </div>

                  {/* Metadata fields */}
                  <p className="text-xs font-semibold uppercase tracking-widest pt-1"
                     style={{ color: 'var(--color-muted)' }}>Overlay text (optional)</p>
                  {[
                    { key: 'title',    label: 'Title',       placeholder: 'e.g. Summer Sale'   },
                    { key: 'subtitle', label: 'Subtitle',    placeholder: 'e.g. Up to 30% off' },
                    { key: 'ctaText',  label: 'Button Text', placeholder: 'e.g. Shop Now'      },
                    { key: 'ctaLink',  label: 'Button Link', placeholder: '/products'          },
                    { key: 'order',    label: 'Display Order (0 = first)', placeholder: '0'    },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1"
                             style={{ color: 'var(--color-dark)' }}>{label}</label>
                      <input
                        type={key === 'order' ? 'number' : 'text'}
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="input text-sm"
                      />
                    </div>
                  ))}

                  {/* Upload button */}
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                               text-white text-sm font-medium transition-all hover:opacity-90
                               disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {uploading
                      ? <><Spin /> Uploading to Cloudinary...</>
                      : <><FiUpload size={15} /> Upload {selectedIsVideo ? 'Video' : 'Image'}</>}
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={e => { handleFileSelect(e.target.files[0]); e.target.value = ''; }}
              />
            </div>


            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Images', value: images.length, icon: <FiImage size={16} />, color: 'var(--color-primary)' },
                { label: 'Videos', value: videos.length, icon: <FiVideo size={16} />, color: '#7C3AED' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 text-center"
                     style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                       style={{ backgroundColor: color + '18', color }}>
                    {icon}
                  </div>
                  <p className="text-xl font-semibold"
                     style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                    {value}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
            <FeaturedProductPicker /> 
          </div>

          {/* ── Media grid ── */}
          <div className="lg:col-span-2 space-y-6">

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse"
                       style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="aspect-video" style={{ backgroundColor: 'var(--color-soft)' }} />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                      <div className="h-3 w-1/2 rounded-full" style={{ backgroundColor: 'var(--color-soft)' }} />
                    </div>
                  </div>
                ))}
              </div>

            ) : media.length === 0 ? (
              <div className="bg-white rounded-2xl py-20 text-center"
                   style={{ boxShadow: 'var(--shadow-card)' }}>
                <FiImage size={36} style={{ color: 'var(--color-muted)' }} className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: 'var(--color-dark)' }}>
                  No media yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Upload your first image or video using the panel on the left
                </p>
              </div>

            ) : (
              <>
                {/* Images section */}
                {images.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                       style={{ color: 'var(--color-muted)' }}>
                      Banner Images ({images.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {images.map(item => (
                        <MediaCard
                          key={item._id}
                          item={item}
                          onDelete={handleDelete}
                          onRefresh={fetchMedia}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos section */}
                {videos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                       style={{ color: 'var(--color-muted)' }}>
                      Promo Videos ({videos.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {videos.map(item => (
                        <MediaCard
                          key={item._id}
                          item={item}
                          onDelete={handleDelete}
                          onRefresh={fetchMedia}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}