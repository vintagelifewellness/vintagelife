// lib/otpStore.js
const otpStore = new Map();

export function setOtp(email, otp, ttlMs = 5 * 60 * 1000) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + ttlMs,
    attempts: 0,
  });
}

export function verifyOtp(email, inputOtp) {
  const record = otpStore.get(email);
  if (!record) return { ok: false, message: "No OTP requested" };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { ok: false, message: "OTP expired" };
  }
  if (record.attempts >= 5) {
    otpStore.delete(email);
    return { ok: false, message: "Too many attempts. Request again." };
  }
  if (record.otp !== String(inputOtp)) {
    record.attempts += 1;
    return { ok: false, message: "Invalid OTP" };
  }
  otpStore.delete(email);
  return { ok: true };
}

export function clearOtp(email) {
  otpStore.delete(email);
}