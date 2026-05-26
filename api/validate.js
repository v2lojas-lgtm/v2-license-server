const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { license_key, machine_id } = req.body || {}

  if (!license_key || !machine_id) {
    return res.status(400).json({ valid: false, error: 'license_key e machine_id são obrigatórios' })
  }

  const result = await query('SELECT * FROM licenses WHERE license_key = $1', [license_key])
  const license = result.rows[0]

  if (!license || !license.is_active) {
    return res.status(403).json({ valid: false, error: 'Licença inválida ou desativada' })
  }

  if (new Date() > new Date(license.expires_at)) {
    return res.status(403).json({ valid: false, error: 'Licença expirada', expires_at: license.expires_at })
  }

  const activation = await query(
    'SELECT id FROM activations WHERE license_key = $1 AND machine_id = $2',
    [license_key, machine_id]
  )

  if (activation.rows.length === 0) {
    return res.status(403).json({ valid: false, error: 'Máquina não ativada com esta licença' })
  }

  await query(
    'UPDATE activations SET last_validated_at = NOW() WHERE license_key = $1 AND machine_id = $2',
    [license_key, machine_id]
  )

  return res.status(200).json({ valid: true, expires_at: license.expires_at })
}
