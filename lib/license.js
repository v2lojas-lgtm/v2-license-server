const crypto = require('crypto')

function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `V2GO-${rand(4)}-${rand(4)}-${rand(4)}`;
}

function verifyKiwifyToken(token) {
  if (!token) return false
  return token === process.env.KIWIFY_WEBHOOK_TOKEN
}

module.exports = { generateLicenseKey, verifyKiwifyToken }
