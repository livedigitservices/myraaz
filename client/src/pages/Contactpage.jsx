/**
 * ContactPage.jsx — Production-ready contact form using EmailJS
 *
 * SETUP (one-time, ~5 minutes):
 * 1. npm install @emailjs/browser
 * 2. Sign up at https://emailjs.com (free — 200 emails/month)
 * 3. Dashboard → Email Services → Add Service → connect Gmail/Outlook
 * 4. Dashboard → Email Templates → Create Template
 *    Use these variables in the template body:
 *      {{from_name}}  {{from_email}}  {{subject}}  {{message}}
 *    Set "To Email" to your inbox (e.g. support@myraaz.com)
 * 5. Copy your Service ID, Template ID, and Public Key into the .env file:
 *      VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
 *      VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
 *      VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxx
 */

import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

// ─── EmailJS config from environment variables ─────────────────────────────
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ─── Subject options ────────────────────────────────────────────────────────
const SUBJECTS = [
  'Order Enquiry',
  'Product Question',
  'Shipping / Delivery',
  'Returns & Refunds',
  'Wholesale / Bulk Order',
  'Other',
];

// ─── Field validation ────────────────────────────────────────────────────────
function validate({ name, email, subject, message }) {
  const errors = {};
  if (!name.trim())                          errors.name    = 'Name is required.';
  if (!email.trim())                         errors.email   = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                             errors.email   = 'Enter a valid email address.';
  if (!subject)                              errors.subject = 'Please select a subject.';
  if (!message.trim())                       errors.message = 'Message cannot be empty.';
  else if (message.trim().length < 20)       errors.message = 'Please write at least 20 characters.';
  return errors;
}

// ─── Input wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark mb-1">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <FiAlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error) =>
  `w-full border rounded-xl px-4 py-3 text-sm text-dark placeholder:text-muted
   focus:outline-none focus:ring-2 transition-colors
   ${error
     ? 'border-red-400 focus:ring-red-200'
     : 'border-soft focus:ring-primary/30 focus:border-primary/50'}`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function ContactPage() {
  const formRef = useRef(null);

  const [fields, setFields] = useState({
    name: '', email: '', subject: '', message: '',
  });
  const [errors,  setErrors]  = useState({});
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [touched, setTouched] = useState({});

  // Validate a single field on blur
  function handleBlur(e) {
    const name = e.target.name;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldErrors = validate(fields);
    setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear error as user types (only if field was already touched)
    if (touched[name]) {
      const fieldErrors = validate({ ...fields, [name]: value });
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Mark all fields as touched and run full validation
    setTouched({ name: true, email: true, subject: true, message: true });
    const fieldErrors = validate(fields);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus('loading');

    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY);
      setStatus('success');
      setFields({ name: '', email: '', subject: '', message: '' });
      setTouched({});
    } catch (err) {
      console.error('EmailJS error:', err);
      setStatus('error');
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
          <FiCheckCircle size={40} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-dark font-semibold mb-2">
            Message sent!
          </h2>
          <p className="text-muted text-sm mb-6">
            Thank you for reaching out. We usually reply within 24 hours.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-sm text-primary font-medium hover:underline"
          >
            Send another message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-dark font-semibold mb-2">Contact Us</h1>
      <p className="text-muted mb-8">
        Have a question or need help? We usually respond within 24 hours.
      </p>

      {/* Global error banner */}
      {status === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <FiAlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
          <p className="text-sm text-red-600">
            Something went wrong. Please try again or email us directly at{' '}
            <a href="mailto:support@myraaz.com" className="font-medium underline">
              support@myraaz.com
            </a>.
          </p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name */}
        <Field label="Name" error={errors.name}>
          <input
            type="text"
            name="from_name"
            value={fields.name}
            onChange={e => handleChange({ target: { name: 'name', value: e.target.value } })}
            onBlur={e => handleBlur({ target: { name: 'name' } })}
            placeholder="Your full name"
            autoComplete="name"
            className={inputClass(errors.name)}
          />
        </Field>

        {/* Email */}
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            name="from_email"
            value={fields.email}
            onChange={e => handleChange({ target: { name: 'email', value: e.target.value } })}
            onBlur={e => handleBlur({ target: { name: 'email' } })}
            placeholder="you@email.com"
            autoComplete="email"
            className={inputClass(errors.email)}
          />
        </Field>

        {/* Subject */}
        <Field label="Subject" error={errors.subject}>
          <select
            name="subject"
            value={fields.subject}
            onChange={e => handleChange({ target: { name: 'subject', value: e.target.value } })}
            onBlur={e => handleBlur({ target: { name: 'subject' } })}
            className={`${inputClass(errors.subject)} bg-white`}
          >
            <option value="">Select a topic…</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        {/* Message */}
        <Field label="Message" error={errors.message}>
          <textarea
            name="message"
            rows={5}
            value={fields.message}
            onChange={e => handleChange({ target: { name: 'message', value: e.target.value } })}
            onBlur={e => handleBlur({ target: { name: 'message' } })}
            placeholder="How can we help you?"
            className={`${inputClass(errors.message)} resize-none`}
          />
          <p className="mt-1 text-xs text-muted text-right">
            {fields.message.length} / 1000
          </p>
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold
                     hover:opacity-90 transition-opacity disabled:opacity-60
                     flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <FiLoader size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </form>

      {/* Contact info */}
      <div className="mt-12 border-t border-soft pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted">
        <div>
          <p className="font-medium text-dark mb-1">Email</p>
          <a href="mailto:support@myraaz.com" className="hover:text-primary transition-colors">
            support@myraaz.com
          </a>
        </div>
        <div>
          <p className="font-medium text-dark mb-1">Hours</p>
          <p>Mon – Sat, 9 AM – 6 PM IST</p>
        </div>
      </div>
    </main>
  );
}