const crypto = require('crypto')

/** Código numérico de 6 dígitos (000000-999999), com zero-padding. */
function generateCode() {
  const n = crypto.randomInt(0, 1000000)
  return String(n).padStart(6, '0')
}

module.exports = { generateCode }
