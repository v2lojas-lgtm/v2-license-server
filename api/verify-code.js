/**
 * POST /api/verify-code
 * Body: { email, code, machine_id }
 * Confirma o código enviado por e-mail e ativa esta máquina.
 */
const { query } = require('../lib/db')

const MAX_ATTEMPTS = 5

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, code, machine_id } = req.body || {}
  if (!email || !code || !machine_id) {
    return res.status(400).json({ success: false, error: 'email, code e machine_id são obrigatórios' })
  }

  try {
    const codeResult = await query('SELECT * FROM login_codes WHERE email = $1', [email])
    const loginCode = codeResult.rows[0]

    if (!loginCode || loginCode.consumed || new Date() > new Date(loginCode.expires_at)) {
      return res.status(403).json({ success: false, error: 'Código inválido ou expirado. Peça um novo código.' })
    }

    if (loginCode.attempts >= MAX_ATTEMPTS) {
      return res.status(403).json({ success: false, error: 'Muitas tentativas. Peça um novo código.' })
    }

    if (loginCode.code !== String(code).trim()) {
      await query('UPDATE login_codes SET attempts = attempts + 1 WHERE email = $1', [email])
      return res.status(403).json({ success: false, error: 'Código incorreto' })
    }

    const licenseResult = await query(
      `SELECT * FROM email_licenses WHERE email = $1 AND is_active = TRUE`,
      [email]
    )
    const license = licenseResult.rows[0]
    if (!license) {
      return res.status(403).json({ success: false, error: 'Nenhuma licença ativa encontrada para este e-mail' })
    }
    if (new Date() > new Date(license.expires_at)) {
      return res.status(403).json({ success: false, error: 'Licença expirada' })
    }

    await query('UPDATE login_codes SET consumed = TRUE WHERE email = $1', [email])

    const existingActivation = await query(
      'SELECT id FROM activations WHERE email_license_id = $1 AND machine_id = $2',
      [license.id, machine_id]
    )

    if (existingActivation.rows.length > 0) {
      await query(
        'UPDATE activations SET last_validated_at = NOW() WHERE email_license_id = $1 AND machine_id = $2',
        [license.id, machine_id]
      )
      return res.status(200).json({ success: true, expires_at: license.expires_at })
    }

    const count = await query(
      'SELECT COUNT(*) FROM activations WHERE email_license_id = $1',
      [license.id]
    )
    const activationCount = parseInt(count.rows[0].count)

    if (activationCount >= license.max_activations) {
      return res.status(403).json({ success: false, error: `Limite de ${license.max_activations} PC(s) atingido` })
    }

    await query(
      'INSERT INTO activations (email_license_id, machine_id) VALUES ($1, $2)',
      [license.id, machine_id]
    )

    return res.status(200).json({ success: true, expires_at: license.expires_at })
  } catch (err) {
    console.error('verify-code error:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}
