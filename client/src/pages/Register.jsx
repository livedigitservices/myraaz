import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff,
  FiCheck, FiPhone, FiShield, FiArrowLeft, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── OTP Input — 6 boxes ── */
const OTPInput = ({ value, onChange }) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, i) => {
    const key = e.key;
    if (key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) document.getElementById(`rotp-${i - 1}`)?.focus();
      return;
    }
    if (!/^\d$/.test(key)) return;
    const next = value.slice(0, i) + key + value.slice(i + 1);
    onChange(next.slice(0, 6));
    if (i < 5) document.getElementById(`rotp-${i + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    document.getElementById(`rotp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`rotp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={() => {}}
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

/* ── Password strength ── */
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const strength = {
    length: password.length >= 6,
    upper:  /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const score = Object.values(strength).filter(Boolean).length;
  const label = ['', 'Weak', 'Fair', 'Strong'][score];
  const color = ['', '#ef4444', '#f59e0b', '#22c55e'][score];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
               style={{ backgroundColor: i <= score ? color : 'var(--color-soft)' }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
        <div className="flex gap-3">
          {[
            { label: '6+ chars', pass: strength.length },
            { label: 'Uppercase', pass: strength.upper  },
            { label: 'Number',    pass: strength.number },
          ].map(({ label: l, pass }) => (
            <span key={l} className="text-xs flex items-center gap-1"
                  style={{ color: pass ? '#22c55e' : 'var(--color-muted)' }}>
              {pass ? '✓' : '·'} {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Spinner ── */
const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ══════════════════════════════════════
   REGISTER PAGE
══════════════════════════════════════ */
export default function Register() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [mode, setMode]     = useState('email'); // 'email' | 'phone'
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  /* ── Email signup state ── */
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: ''
  });

  /* ── Phone signup state ── */
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp' | 'details'
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [phoneDetails, setPhoneDetails]   = useState({ name: '' });
  const [tempToken, setTempToken]   = useState('');
const [tempUserId, setTempUserId] = useState('');

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Email register ── */
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast.error('Please fill in all fields');
    if (form.password !== form.confirm)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');
    try {
      setLoading(true);
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      login(data);
      toast.success(`Welcome to myRaaz, ${data.name}! 🌿`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Send OTP ── */
  // const handleSendOTP = async () => {
  //   if (!/^\d{10}$/.test(phone.replace(/\s/g, '')))
  //     return toast.error('Enter a valid 10-digit phone number');
  //   try {
  //     setLoading(true);
  //     await api.post('/auth/send-otp', { phone });
  //     setPhoneStep('otp');
  //     toast.success('OTP sent to your phone 📱');
  //     startResendTimer();
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Failed to send OTP');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSendOTP = async () => {
  if (!/^\d{10}$/.test(phone.replace(/\s/g, '')))
    return toast.error('Enter a valid 10-digit phone number');
  try {
    setLoading(true);
    await api.post('/auth/send-otp', { phone });
    setPhoneStep('otp');
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
  if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
  try {
    setLoading(true);
    const { data } = await api.post('/auth/verify-otp', { phone, otp });

    if (data.name?.startsWith('User')) {
      /* New user — save token and ask for name */
      setVerifiedPhone(phone);
      setTempToken(data.token);
      setTempUserId(data._id);
      setPhoneStep('details');
      toast.success('Phone verified! Complete your profile 🌿');
    } else {
      /* Existing user — log in directly */
      login(data);
      toast.success(`Welcome back, ${data.name}! 👋`);
      navigate('/');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Invalid OTP');
  } finally {
    setLoading(false);
  }
};

/* ── Save name after phone verify ── */
const handleSaveDetails = async () => {
  if (!phoneDetails.name.trim())
    return toast.error('Please enter your name');
  try {
    setLoading(true);

    /* Use token from OTP verification — no second verify-otp call */
    const { data: updated } = await api.put(
      '/users/profile',
      { name: phoneDetails.name },
      { headers: { Authorization: `Bearer ${tempToken}` } }
    );

    login({
      _id:     tempUserId,
      name:    updated.name,
      email:   updated.email,
      phone:   `+91${phone}`,
      isAdmin: false,
      token:   tempToken,
    });

    toast.success(`Welcome to myRaaz, ${updated.name}! 🌿`);
    navigate('/');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to save details');
  } finally {
    setLoading(false);
  }
};

  const switchMode = (m) => {
    setMode(m);
    setPhoneStep('phone');
    setOtp('');
    setPhone('');
    setVerifiedPhone('');
    setPhoneDetails({ name: '' });
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── LEFT — decorative ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12
                      relative overflow-hidden"
           style={{ backgroundColor: 'var(--color-dark)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
             style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="absolute -bottom-10 -left-20 w-96 h-96 rounded-full opacity-5"
             style={{ backgroundColor: 'var(--color-primary)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
               style={{ backgroundColor: 'var(--color-accent)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--color-dark)' }}>M</span>
          </div>
          <span className="text-white text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-serif)' }}>myRaaz</span>
        </div>

        {/* Center */}
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold text-white leading-snug mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}>
            Join the myRaaz family today.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Create your account with email or just your phone number.
            No password needed for mobile signup!
          </p>

          {/* Benefits */}
          {[
            '📱 Sign up with just your phone number',
            '🔒 Secure OTP verification',
            '🚚 Free shipping on orders above ₹499',
            '💛 Exclusive member discounts',
            '📦 Track orders easily',
          ].map(text => (
            <div key={text} className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                   style={{ backgroundColor: 'var(--color-accent)' }}>
                <FiCheck size={10} style={{ color: 'var(--color-dark)' }} />
              </div>
              <span className="text-white/80 text-sm">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs relative z-10">© 2025 myRaaz. All rights reserved.</p>
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
            Create account
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            Sign up with email or mobile number
          </p>

          {/* ── MODE TOGGLE ── */}
          <div className="flex p-1 rounded-2xl mb-6"
               style={{ backgroundColor: 'var(--color-soft)' }}>
            {[
              { key: 'email', icon: <FiMail size={14} />,  label: 'Email'      },
              { key: 'phone', icon: <FiPhone size={14} />, label: 'Mobile OTP' },
            ].map(({ key, icon, label }) => (
              <button key={key} onClick={() => switchMode(key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5
                           rounded-xl text-sm font-medium transition-all duration-200"
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
              EMAIL SIGNUP
          ══════════════════════════ */}
          {mode === 'email' && (
            <form onSubmit={handleEmailRegister} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Full Name</label>
                <div className="relative">
                  <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type="text" name="name" value={form.name}
                    onChange={handleChange} placeholder="Priya Sharma"
                    className="input pl-10 text-sm" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Email Address</label>
                <div className="relative">
                  <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="you@example.com"
                    className="input pl-10 text-sm" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type={showPass ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="Min. 6 characters"
                    className="input pl-10 pr-10 text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }}>
                    {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Confirm Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input type="password" name="confirm" value={form.confirm}
                    onChange={handleChange} placeholder="Re-enter password"
                    className="input pl-10 text-sm"
                    style={{
                      borderColor: form.confirm && form.confirm !== form.password
                        ? '#ef4444' : undefined
                    }} />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs mt-1 text-red-500">Passwords don't match</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all disabled:opacity-60 flex items-center
                           justify-center gap-2 mt-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading
                  ? <><Spinner /> Creating account...</>
                  : <><FiCheck size={14} /> Create Account</>}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
                By signing up you agree to our{' '}
                <a href="#" className="underline" style={{ color: 'var(--color-primary)' }}>
                  Terms
                </a>{' '}and{' '}
                <a href="#" className="underline" style={{ color: 'var(--color-primary)' }}>
                  Privacy Policy
                </a>
              </p>
            </form>
          )}

          {/* ══════════════════════════
              PHONE SIGNUP — Step 1: Enter phone
          ══════════════════════════ */}
          {mode === 'phone' && phoneStep === 'phone' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl text-sm"
                   style={{ backgroundColor: 'var(--color-soft)', color: 'var(--color-muted)' }}>
                📱 Enter your mobile number. We'll send a one-time OTP to verify it.
                No password required!
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 rounded-xl border text-sm
                                  font-medium shrink-0"
                       style={{ borderColor: 'var(--color-soft)',
                                color: 'var(--color-dark)',
                                backgroundColor: 'var(--color-soft)' }}>
                    🇮🇳 +91
                  </div>
                  <div className="relative flex-1">
                    <FiPhone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                             style={{ color: 'var(--color-muted)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleSendOTP}
                disabled={loading || phone.length !== 10}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all disabled:opacity-60 flex items-center
                           justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading
                  ? <><Spinner /> Sending OTP...</>
                  : <><FiPhone size={14} /> Send OTP</>}
              </button>
            </div>
          )}

          {/* ══════════════════════════
              PHONE SIGNUP — Step 2: Enter OTP
          ══════════════════════════ */}
          {mode === 'phone' && phoneStep === 'otp' && (
            <div className="space-y-5">

              {/* Info */}
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                   style={{ backgroundColor: 'var(--color-soft)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                     style={{ backgroundColor: 'var(--color-primary)' }}>
                  <FiShield size={16} color="white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-dark)' }}>
                    OTP sent to +91 {phone}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Valid for 5 minutes
                  </p>
                </div>
                <button onClick={() => { setPhoneStep('phone'); setOtp(''); }}
                  style={{ color: 'var(--color-primary)' }}>
                  <FiArrowLeft size={15} />
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

              {/* Verify */}
              <button onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all disabled:opacity-60 flex items-center
                           justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading
                  ? <><Spinner /> Verifying...</>
                  : <><FiShield size={14} /> Verify OTP</>}
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
                    className="text-xs flex items-center gap-1.5 mx-auto hover:underline"
                    style={{ color: 'var(--color-primary)' }}>
                    <FiRefreshCw size={12} /> Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════
              PHONE SIGNUP — Step 3: Enter name
          ══════════════════════════ */}
          {mode === 'phone' && phoneStep === 'details' && (
            <div className="space-y-5">

              {/* Success badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                   style={{ backgroundColor: '#D1FAE5' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center
                                bg-green-500 shrink-0">
                  <FiCheck size={16} color="white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    +91 {verifiedPhone || phone} verified!
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Just one more step to complete your profile
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--color-dark)' }}>Your Name</label>
                <div className="relative">
                  <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted)' }} />
                  <input
                    type="text"
                    value={phoneDetails.name}
                    onChange={e => setPhoneDetails({ name: e.target.value })}
                    placeholder="Priya Sharma"
                    className="input pl-10 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Info */}
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                You can add your email and other details later from your profile settings.
              </p>

              {/* Complete */}
              <button onClick={handleSaveDetails}
                disabled={loading || !phoneDetails.name.trim()}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all disabled:opacity-60 flex items-center
                           justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading
                  ? <><Spinner /> Saving...</>
                  : <><FiCheck size={14} /> Complete Signup</>}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              already have an account?
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
          </div>

          <Link to="/login"
                className="w-full py-3 rounded-full font-medium text-sm text-center
                           block transition-all hover:opacity-80"
                style={{ border: '1.5px solid var(--color-primary)',
                         color: 'var(--color-primary)' }}>
            Sign in instead
          </Link>

        </div>
      </div>
    </div>
  );
}