const { generateLicenseKey, verifyKiwifyToken } = require('../lib/license')
const { query } = require('../lib/db')
const { sendLicenseEmail } = require('../lib/mailer')

module.exports = async function handler(req, res) {
  // V2GO migrou para assinatura pela loja (mk20-loja). Kiwify não é mais usado.
  return res.status(200).json({ received: true })
}
