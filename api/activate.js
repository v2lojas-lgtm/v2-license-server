const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { license_key, machine_id } = req.body || {}

  if (!license_key || !machine_id) {
    return res.status(400).json({ success: false, error: 'license_key e machine_id são obrigatórios' })
  }

  const result = await query('SELECT * FROM licenses WHERE license_key = $1', [license_key])
  const license = result.rows[0]

  if (!license) {
    return res.status(404).json({ success: false, error: 'Licença não encontrada' })
  }

  if (!license.is_active) {
    return res.status(403).json({ success: false, error: 'Licença desativada' })
  }

  if (new Date() > new Date(license.expires_at)) {
    return res.status(403).json({ success: false, error: 'Licença expirada' })
  }

  // Check if this machine is already activated
  const existing = await query(
    'SELECT id FROM activations WHERE license_key = $1 AND machine_id = $2',
    [license_key, machine_id]
  )

  if (existing.rows.length > 0) {
    await query(
      'UPDATE activations SET last_validated_at = NOW() WHERE license_key = $1 AND machine_id = $2',
      [license_key, machine_id]
    )
    return res.status(200).json({ success: true, expires_at: license.expires_at })
  }

  // Check activation limit
  const count = await query(
    'SELECT COUNT(*) FROM activations WHERE license_key = $1',
    [license_key]
  )
  const activationCount = parseInt(count.rows[0].count)

  if (activationCount >= license.max_activations) {
    return res.status(403).json({ success: false, error: `Limite de ${license.max_activations} PC(s) atingido` })
  }

  await query(
    'INSERT INTO activations (license_key, machine_id) VALUES ($1, $2)',
    [license_key, machine_id]
  )

  return res.status(200).json({ success: true, expires_at: license.expires_at })
}
