const { Pool } = require('pg')

let pool
let schemaReady = false

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  }
  return pool
}

async function ensureSchema() {
  if (schemaReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      license_key VARCHAR(255) UNIQUE NOT NULL,
      variant_id VARCHAR(255) NOT NULL,
      max_activations INTEGER NOT NULL DEFAULT 1,
      expires_at TIMESTAMP NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS activations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      license_key VARCHAR(255) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
      machine_id VARCHAR(255) NOT NULL,
      activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_validated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(license_key, machine_id)
    );
    CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
    CREATE INDEX IF NOT EXISTS idx_licenses_order_id    ON licenses(order_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_email       ON licenses(email);
    CREATE INDEX IF NOT EXISTS idx_activations_license_key ON activations(license_key);
    CREATE INDEX IF NOT EXISTS idx_activations_machine_id  ON activations(machine_id);

    -- Ativação por e-mail (sem chave) — aditivo, não toca nas tabelas/colunas acima.
    CREATE TABLE IF NOT EXISTS email_licenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      order_id VARCHAR(255),
      max_activations INTEGER NOT NULL DEFAULT 3,
      expires_at TIMESTAMP NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS login_codes (
      email VARCHAR(255) PRIMARY KEY,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      consumed BOOLEAN NOT NULL DEFAULT FALSE,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ALTER TABLE activations ADD COLUMN IF NOT EXISTS email_license_id UUID REFERENCES email_licenses(id) ON DELETE CASCADE;
    ALTER TABLE activations ALTER COLUMN license_key DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_activations_email_machine ON activations(email_license_id, machine_id) WHERE email_license_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_email_licenses_email ON email_licenses(email);
  `)
  schemaReady = true
}

async function query(text, params) {
  await ensureSchema()
  return getPool().query(text, params)
}

module.exports = { query }
