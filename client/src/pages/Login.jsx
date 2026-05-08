import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiPhone, FiShield, FiArrowLeft, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── OTP Input — 6 individual boxes ── */
const OTPInput = ({ value, onChange }) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, i) => {
    const key = e.key;

    if (key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
      return;
    }

    if (!/^\d$/.test(key)) return;

    const next = value.slice(0, i) + key + value.slice(i + 1);
    onChange(next.slice(0, 6));
    if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={() => {}} // controlled via onKeyDown
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2
                     outline-none transition-all"
          style={{
            borderColor: d ? 'var(--color-primary)' : 'var(--color-soft)',
            backgroundColor: d ? 'var(--color-soft)' : 'white',
            color: 'var(--color-dark)',
          }}
        />
      ))}
    </div>
  );
};

/* ══════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════ */
export default function Login() {
  const [mode, setMode]         = useState('email'); // 'email' | 'phone'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  /* Email login state */
  const [form, setForm] = useState({ email: '', password: '' });

  /* Phone OTP state */
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Email login ── */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast.error('Please fill in all fields');
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success(`Welcome back, ${data.name}! 👋`);
      navigate(data.isAdmin ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Send OTP ── */
const handleSendOTP = async () => {
  if (!/^\d{10}$/.test(phone.replace(/\s/g, '')))
    return toast.error('Enter a valid 10-digit phone number');
  try {
    setLoading(true);
    await api.post('/auth/send-otp', { phone });
    setOtpSent(true);
    toast.success('OTP sent to your mobile number 📱');
    startResendTimer();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
};
  /* ── Resend timer ── */
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  /* ── Verify OTP ── */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6)
      return toast.error('Please enter the 6-digit OTP');
    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-otp', { phone, otp });
      login(data);
      toast.success(`Welcome, ${data.name}! 👋`);
      navigate(data.isAdmin ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── Spinner ── */
  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── LEFT — decorative ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
             style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full opacity-10"
             style={{ backgroundColor: 'var(--color-dark)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>M</span>
          </div>
          <span className="text-white text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)' }}>myRaaz</span>
        </div>

        {/* Center text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold text-white leading-snug mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}>
            Beautiful hair starts with the right care.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Sign in to explore our premium collection of hair oils, shampoos,
            and treatments crafted from nature's finest ingredients.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['📱 Login with OTP', '🔒 Secure & Fast', '🌿 100% Natural Products'].map(t => (
              <span key={t} className="text-xs px-3 py-1.5 rounded-full text-white/80"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                {t}
              </span>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-8 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-white/90 text-sm italic leading-relaxed">
              "myRaaz transformed my hair. The OTP login makes it so quick and easy!"
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                   style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)' }}>P</div>
              <div>
                <p className="text-white text-xs font-medium">Priya Sharma</p>
                <p className="text-white/60 text-xs">Verified Customer</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">© 2025 myRaaz. All rights reserved.</p>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: 'var(--color-primary)' }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
              myRaaz
            </span>
          </div>

          <h1 className="text-3xl font-semibold mb-1"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            Sign in to your account to continue
          </p>

          {/* ── MODE TOGGLE ── */}
          <div className="flex p-1 rounded-2xl mb-6"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            {[
              { key: 'email', icon: <FiMail size={14} />,  label: 'Email'  },
              { key: 'phone', icon: <FiPhone size={14} />, label: 'Mobile OTP' },
            ].map(({ key, icon, label }) => (
              <button key={key}
                onClick={() => {
                  setMode(key);
                  setOtpSent(false);
                  setOtp('');
                  setPhone('');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                           text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: mode === key ? 'white' : 'transparent',
                  color: mode === key ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: mode === key ? 'var(--shadow-card)' : 'none',
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════
              EMAIL LOGIN
          ══════════════════════════ */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Email address</label>
                <div className="relative">
                  <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="you@example.com"
                    className="input pl-10" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium"
                         style={{ color: 'var(--color-dark)' }}>Password</label>
                  <a href="#" className="text-xs hover:underline"
                     style={{ color: 'var(--color-primary)' }}>Forgot password?</a>
                </div>
                <div className="relative">
                  <FiLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type={showPass ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="••••••••"
                    className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }}>
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all disabled:opacity-60 flex items-center
                           justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading ? <><Spinner /> Signing in...</> : 'Sign in'}
              </button>
            </form>
          )}

          {/* ══════════════════════════
              PHONE OTP LOGIN
          ══════════════════════════ */}
          {mode === 'phone' && (
            <div className="space-y-5">

              {/* Phone input */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Mobile Number</label>
                <div className="flex gap-2">
                  {/* Country code */}
                  <div className="flex items-center gap-1.5 px-3 rounded-xl border text-sm
                                  font-medium shrink-0"
                       style={{ borderColor: 'var(--color-soft)',
                                color: 'var(--color-dark)',
                                backgroundColor: 'var(--color-soft)' }}>
                    🇮🇳 +91
                  </div>
                  <div className="relative flex-1">
                    <FiPhone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                             style={{ color: 'var(--color-muted)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (otpSent) { setOtpSent(false); setOtp(''); }
                      }}
                      placeholder="9876543210"
                      className="input pl-10"
                      disabled={otpSent}
                    />
                  </div>
                </div>
              </div>

              {/* Send OTP button */}
              {!otpSent ? (
                <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                  className="w-full py-3 rounded-full text-white font-medium text-sm
                             transition-all disabled:opacity-60 flex items-center
                             justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {loading ? <><Spinner /> Sending OTP...</> : <><FiPhone size={14} /> Send OTP</>}
                </button>
              ) : (
                <>
                  {/* OTP sent info */}
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ backgroundColor: 'var(--color-soft)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                         style={{ backgroundColor: 'var(--color-primary)' }}>
                      <FiShield size={14} color="white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>
                        OTP sent to +91 {phone}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Valid for 5 minutes
                      </p>
                    </div>
                    <button
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="ml-auto text-xs hover:underline shrink-0"
                      style={{ color: 'var(--color-primary)' }}>
                      <FiArrowLeft size={13} />
                    </button>
                  </div>

                  {/* OTP boxes */}
                  <div>
                    <label className="block text-sm font-medium mb-3"
                           style={{ color: 'var(--color-dark)' }}>
                      Enter 6-digit OTP
                    </label>
                    <OTPInput value={otp} onChange={setOtp} />
                  </div>

                  {/* Verify button */}
                  <button onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 rounded-full text-white font-medium text-sm
                               transition-all disabled:opacity-60 flex items-center
                               justify-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {loading
                      ? <><Spinner /> Verifying...</>
                      : <><FiShield size={14} /> Verify & Login</>}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Resend OTP in{' '}
                        <span className="font-semibold"
                              style={{ color: 'var(--color-primary)' }}>
                          {resendTimer}s
                        </span>
                      </p>
                    ) : (
                      <button onClick={handleSendOTP} disabled={loading}
                        className="text-xs flex items-center gap-1.5 mx-auto hover:underline
                                   disabled:opacity-50"
                        style={{ color: 'var(--color-primary)' }}>
                        <FiRefreshCw size={12} /> Resend OTP
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
          </div>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}>
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}