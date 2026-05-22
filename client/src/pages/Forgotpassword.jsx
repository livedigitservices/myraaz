import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowLeft, FiRefreshCw, FiShield, FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

/* ── Reusable 6-box OTP Input ── */
const OTPInput = ({ value, onChange }) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, i) => {
    const key = e.key;
    if (key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) document.getElementById(`fp-otp-${i - 1}`)?.focus();
      return;
    }
    if (!/^\d$/.test(key)) return;
    const next = value.slice(0, i) + key + value.slice(i + 1);
    onChange(next.slice(0, 6));
    if (i < 5) document.getElementById(`fp-otp-${i + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    document.getElementById(`fp-otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`fp-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={() => {}}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all"
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

/* ── Password strength meter ── */
const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter',  pass: /[A-Z]/.test(password) },
    { label: 'One number',            pass: /\d/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['#e5e7eb', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? colors[score] : 'var(--color-soft)' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
              style={{ backgroundColor: pass ? '#22c55e' : 'var(--color-soft)' }}
            >
              {pass && (
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs" style={{ color: pass ? 'var(--color-dark)' : 'var(--color-muted)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Spinner ── */
const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

/* ══════════════════════════════════════
   STEPS:
   0 → Enter Email
   1 → Verify OTP
   2 → Reset Password
   3 → Success
══════════════════════════════════════ */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);

  /* Step 0 */
  const [email, setEmail]       = useState('');

  /* Step 1 */
  const [otp, setOtp]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  /* Step 2 */
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Resend timer helper ── */
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  /* ── STEP 0: Send reset OTP ── */
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error('Please enter a valid email address');
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email 📧');
      setStep(1);
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 1: Verify OTP ── */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return toast.error('Please enter the 6-digit OTP');
    try {
      setLoading(true);
      await api.post('/auth/verify-reset-otp', { email, otp });
      toast.success('OTP verified ✅');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 2: Reset Password ── */
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword || !confirmPassword)
      return toast.error('Please fill in all fields');
    if (newPassword.length < 8)
      return toast.error('Password must be at least 8 characters');
    if (newPassword !== confirmPassword)
      return toast.error('Passwords do not match');

    const isStrong =
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);
    if (!isStrong)
      return toast.error('Password is too weak. Add uppercase, number & special character.');

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully 🎉');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step config for progress indicator ── */
  const stepLabels = ['Email', 'Verify OTP', 'New Password'];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream)' }}>

      {/* ── LEFT — decorative (same as Login) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
             style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full opacity-10"
             style={{ backgroundColor: 'var(--color-dark)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>M</span>
          </div>
          <span className="text-white text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            myRaaz
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2
            className="text-4xl font-semibold text-white leading-snug mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Account recovery made simple and secure.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            We'll send a one-time code to your email. Follow the steps to securely reset your password.
          </p>

          {/* Steps preview */}
          <div className="mt-8 space-y-3">
            {[
              { step: '1', title: 'Enter your email',      desc: 'We verify your account exists'       },
              { step: '2', title: 'Enter the OTP',         desc: 'Check your inbox for a 6-digit code' },
              { step: '3', title: 'Set a new password',    desc: 'Choose a strong, secure password'    },
            ].map(({ step: s, title, desc }) => (
              <div key={s} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  {s}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © {new Date().getFullYear()} myRaaz. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span
              className="text-xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
            >
              myRaaz
            </span>
          </div>

          {/* Back to login (not shown on success) */}
          {step < 3 && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
              style={{ color: 'var(--color-muted)' }}
            >
              <FiArrowLeft size={14} /> Back to Login
            </Link>
          )}

          {/* ── Progress dots (steps 0–2) ── */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={{
                        backgroundColor: i < step
                          ? '#22c55e'
                          : i === step
                          ? 'var(--color-primary)'
                          : 'var(--color-soft)',
                        color: i <= step ? 'white' : 'var(--color-muted)',
                      }}
                    >
                      {i < step ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: i === step ? 'var(--color-primary)' : 'var(--color-muted)' }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className="h-px w-8 mb-4 transition-all duration-300"
                      style={{ backgroundColor: i < step ? '#22c55e' : 'var(--color-soft)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════
              STEP 0 — Enter Email
          ══════════════════════════ */}
          {step === 0 && (
            <>
              <h1
                className="text-3xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
              >
                Forgot password?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                No worries! Enter your email and we'll send you a reset code.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-dark)' }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <FiMail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full text-white font-medium text-sm
                             transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {loading ? <><Spinner /> Sending...</> : <><FiMail size={14} /> Send OTP</>}
                </button>
              </form>
            </>
          )}

          {/* ══════════════════════════
              STEP 1 — Verify OTP
          ══════════════════════════ */}
          {step === 1 && (
            <>
              <h1
                className="text-3xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
              >
                Check your email
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                We sent a 6-digit code to{' '}
                <span className="font-medium" style={{ color: 'var(--color-dark)' }}>
                  {email}
                </span>
              </p>

              <div className="space-y-5">
                {/* OTP info banner */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-soft)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <FiShield size={14} color="white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-dark)' }}>
                      OTP sent to {email}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Valid for 10 minutes · Check spam if not received
                    </p>
                  </div>
                </div>

                {/* OTP Input */}
                <div>
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: 'var(--color-dark)' }}
                  >
                    Enter 6-digit OTP
                  </label>
                  <OTPInput value={otp} onChange={setOtp} />
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-full text-white font-medium text-sm
                             transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {loading ? <><Spinner /> Verifying...</> : <><FiShield size={14} /> Verify OTP</>}
                </button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Resend OTP in{' '}
                      <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="text-xs flex items-center gap-1.5 mx-auto hover:underline disabled:opacity-50"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <FiRefreshCw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                {/* Wrong email? */}
                <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                  Wrong email?{' '}
                  <button
                    onClick={() => { setStep(0); setOtp(''); }}
                    className="font-medium hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Change it
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ══════════════════════════
              STEP 2 — Reset Password
          ══════════════════════════ */}
          {step === 2 && (
            <>
              <h1
                className="text-3xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
              >
                Set new password
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                Choose a strong password you haven't used before.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* New Password */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-dark)' }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }}
                    />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      placeholder="Create a strong password"
                      className="input pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={passwords.newPassword} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-dark)' }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }}
                    />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
                      }
                      placeholder="Repeat your password"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {passwords.confirmPassword && (
                    <p
                      className="text-xs mt-1.5 flex items-center gap-1"
                      style={{
                        color:
                          passwords.newPassword === passwords.confirmPassword
                            ? '#22c55e'
                            : '#ef4444',
                      }}
                    >
                      {passwords.newPassword === passwords.confirmPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !passwords.newPassword ||
                    passwords.newPassword !== passwords.confirmPassword
                  }
                  className="w-full py-3 rounded-full text-white font-medium text-sm
                             transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {loading ? <><Spinner /> Resetting...</> : <><FiLock size={14} /> Reset Password</>}
                </button>
              </form>
            </>
          )}

          {/* ══════════════════════════
              STEP 3 — Success
          ══════════════════════════ */}
          {step === 3 && (
            <div className="text-center py-8">
              {/* Success icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <FiCheckCircle size={40} color="#22c55e" strokeWidth={1.5} />
              </div>

              <h1
                className="text-3xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}
              >
                Password reset!
              </h1>
              <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-full text-white font-medium text-sm
                           transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Bottom register link */}
          {step < 3 && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-soft)' }} />
              </div>
              <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                Remembered your password?{' '}
                <Link
                  to="/login"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}