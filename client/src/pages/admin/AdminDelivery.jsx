import { useState, useEffect } from 'react';
import { FiTruck, FiPlus, FiTrash2, FiSave, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Spin = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const emptyRule = () => ({
  label: '',
  minOrderValue: 0,
  maxOrderValue: '',
  charge: 0,
  _key: Math.random(),
});

export default function AdminDelivery() {
  const [rules, setRules]               = useState([]);
  const [defaultCharge, setDefaultCharge] = useState(60);
  const [freeAbove, setFreeAbove]       = useState(999);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    api.get('/delivery/config')
      .then(({ data }) => {
        setRules((data.rules || []).map(r => ({ ...r, _key: Math.random() })));
        setDefaultCharge(data.defaultCharge ?? 60);
        setFreeAbove(data.freeAbove ?? 999);
      })
      .catch(() => toast.error('Failed to load delivery config'))
      .finally(() => setLoading(false));
  }, []);

  const addRule = () => setRules(r => [...r, emptyRule()]);

  const removeRule = (key) => setRules(r => r.filter(x => x._key !== key));

  const updateRule = (key, field, value) =>
    setRules(r => r.map(x => x._key === key ? { ...x, [field]: value } : x));

  const save = async () => {
    // Validate
    for (const rule of rules) {
      if (!rule.label.trim()) { toast.error('Each rule needs a label'); return; }
      if (rule.charge === '' || isNaN(Number(rule.charge)) || Number(rule.charge) < 0) {
        toast.error('Charge must be a non-negative number'); return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        defaultCharge: Number(defaultCharge),
        freeAbove:     Number(freeAbove),
        rules: rules.map(({ label, minOrderValue, maxOrderValue, charge }) => ({
          label,
          minOrderValue: Number(minOrderValue) || 0,
          maxOrderValue: maxOrderValue === '' || maxOrderValue === null ? null : Number(maxOrderValue),
          charge:        Number(charge),
        })),
      };
      await api.put('/delivery/config', payload);
      toast.success('Delivery config saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Spin /> <span className="ml-2 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ backgroundColor: 'var(--color-soft)' }}>
          <FiTruck size={18} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-dark)', fontFamily: 'var(--font-serif)' }}>
            Delivery Charges
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Rules are matched top-to-bottom — first match wins
          </p>
        </div>
      </div>

      {/* Fallback defaults */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>Fallback defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
              Free shipping above (₹)
            </label>
            <input
              type="number" min="0"
              value={freeAbove}
              onChange={e => setFreeAbove(e.target.value)}
              className="input w-full text-sm"
              placeholder="999"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-dark)' }}>
              Default charge (₹) — when no rule matches
            </label>
            <input
              type="number" min="0"
              value={defaultCharge}
              onChange={e => setDefaultCharge(e.target.value)}
              className="input w-full text-sm"
              placeholder="60"
            />
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
             style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
          <FiInfo size={13} className="mt-0.5 shrink-0" />
          If no rule below matches, the cart is checked against "Free shipping above". Otherwise the default charge applies.
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
            Custom rules ({rules.length})
          </h2>
          <button
            onClick={addRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiPlus size={12} /> Add rule
          </button>
        </div>

        {rules.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
            No custom rules yet — fallback defaults will be used.
          </p>
        )}

        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <div key={rule._key} className="p-4 rounded-xl space-y-3"
                 style={{ border: '1.5px solid var(--color-soft)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Rule {idx + 1}
                </span>
                <button onClick={() => removeRule(rule._key)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                  <FiTrash2 size={13} className="text-red-400" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                  Label (shown to customer)
                </label>
                <input
                  className="input w-full text-sm"
                  placeholder="e.g. Standard delivery, Express, Free"
                  value={rule.label}
                  onChange={e => updateRule(rule._key, 'label', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                    Min order (₹)
                  </label>
                  <input
                    type="number" min="0"
                    className="input w-full text-sm"
                    value={rule.minOrderValue}
                    onChange={e => updateRule(rule._key, 'minOrderValue', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                    Max order (₹) <span style={{ color: 'var(--color-muted)' }}>(blank = ∞)</span>
                  </label>
                  <input
                    type="number" min="0"
                    className="input w-full text-sm"
                    placeholder="∞"
                    value={rule.maxOrderValue ?? ''}
                    onChange={e => updateRule(rule._key, 'maxOrderValue', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-dark)' }}>
                    Charge (₹)
                  </label>
                  <input
                    type="number" min="0"
                    className="input w-full text-sm"
                    value={rule.charge}
                    onChange={e => updateRule(rule._key, 'charge', e.target.value)}
                  />
                </div>
              </div>

              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                When cart subtotal is ₹{rule.minOrderValue || 0}
                {rule.maxOrderValue ? ` – ₹${rule.maxOrderValue}` : '+'}
                {' '}→ charge ₹{rule.charge === 0 ? '0 (Free)' : rule.charge}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                   text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-primary)' }}>
        {saving ? <><Spin /> Saving…</> : <><FiSave size={15} /> Save delivery config</>}
      </button>
    </div>
  );
}